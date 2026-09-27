/**
 * All sound is synthesised at runtime with Web Audio: plucked strings (Karplus-Strong) for the
 * lute-like tile notes and the tavern music, simple oscillators for everything else.
 * No audio files ship with the game.
 */

export type Sfx =
  | 'tile'
  | 'word'
  | 'bonus'
  | 'bad'
  | 'repeat'
  | 'coin'
  | 'bell'
  | 'serve'
  | 'levelup'
  | 'click'
  | 'page'
  | 'shuffle'
  | 'hint'
  | 'buy';

const mtof = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/** Rising pentatonic notes as letters are chained together. */
const TILE_NOTES = [72, 74, 76, 79, 81, 84, 86, 88, 91];

/** D minor, C, B-flat, A: a tavern-folk progression. */
const PROGRESSION = [
  { bass: 38, chord: [62, 65, 69], scale: [62, 64, 65, 67, 69, 72, 74, 76, 77] },
  { bass: 36, chord: [60, 64, 67], scale: [60, 62, 64, 67, 69, 72, 74, 76, 79] },
  { bass: 34, chord: [58, 62, 65], scale: [58, 62, 65, 67, 69, 70, 74, 77] },
  { bass: 33, chord: [57, 61, 64], scale: [57, 61, 62, 64, 69, 73, 74, 76] },
];
const RHYTHMS = [
  [1, 0, 1, 1, 0, 1],
  [1, 0, 0, 1, 0, 0],
  [1, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 1, 0],
  [1, 0, 0, 1, 1, 1],
];
const EIGHTH = 0.21;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private sfxOn = true;
  private musicOn = true;
  private musicWanted = false;
  private active = true;
  private readonly strings = new Map<string, AudioBuffer>();
  private scheduler: ReturnType<typeof setInterval> | undefined;
  private nextTime = 0;
  private step = 0;
  private melodyNote = 69;

  /** Must be called from a user gesture (browsers keep audio locked until then). */
  unlock() {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor({ latencyHint: 'interactive' });
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.55;
      this.sfxBus.connect(this.master);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.2;
      this.musicBus.connect(this.master);
    }
    if (this.active && this.ctx.state === 'suspended') void this.ctx.resume();
    if (this.musicWanted) this.startScheduler();
  }

  setSfxEnabled(on: boolean) {
    this.sfxOn = on;
  }

  setMusicEnabled(on: boolean) {
    this.musicOn = on;
    if (on && this.musicWanted) this.startScheduler();
    else this.stopScheduler();
  }

  /** App backgrounded or a full-screen ad showing: go silent. */
  setActive(active: boolean) {
    this.active = active;
    if (!this.ctx) return;
    if (active) {
      void this.ctx.resume();
      if (this.musicWanted) this.startScheduler();
    } else {
      this.stopScheduler();
      void this.ctx.suspend();
    }
  }

  playMusic(on: boolean) {
    this.musicWanted = on;
    if (on) this.startScheduler();
    else this.stopScheduler();
  }

  // ── Plucked strings ──────────────────────────────────────────────────────
  private stringBuffer(midi: number, brightness = 0.5): AudioBuffer {
    const key = `${midi}:${brightness}`;
    const cached = this.strings.get(key);
    if (cached) return cached;
    const ctx = this.ctx!;
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * 1.8);
    const buffer = ctx.createBuffer(1, length, rate);
    const out = buffer.getChannelData(0);
    const period = Math.max(2, Math.round(rate / mtof(midi)));
    const ring = new Float32Array(period);
    // Softened noise burst: a darker excitation sounds more like gut strings than steel.
    let prev = 0;
    for (let i = 0; i < period; i++) {
      const noise = Math.random() * 2 - 1;
      prev = prev + brightness * (noise - prev);
      ring[i] = prev;
    }
    const decay = 0.9965;
    let index = 0;
    for (let i = 0; i < length; i++) {
      const current = ring[index]!;
      const next = ring[(index + 1) % period]!;
      ring[index] = decay * 0.5 * (current + next);
      out[i] = current;
      index = (index + 1) % period;
    }
    this.strings.set(key, buffer);
    return buffer;
  }

  private pluck(
    bus: GainNode,
    midi: number,
    when: number,
    volume: number,
    length = 1.2,
    brightness = 0.5,
  ) {
    const ctx = this.ctx!;
    const source = ctx.createBufferSource();
    source.buffer = this.stringBuffer(midi, brightness);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + length);
    source.connect(gain).connect(bus);
    source.start(when);
    source.stop(when + length + 0.05);
  }

  // ── Simple voices ────────────────────────────────────────────────────────
  private tone(
    freq: number,
    when: number,
    duration: number,
    volume: number,
    type: OscillatorType = 'sine',
    endFreq?: number,
  ) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, when + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(volume, when + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain).connect(this.sfxBus);
    osc.start(when);
    osc.stop(when + duration + 0.02);
  }

  private noise(when: number, duration: number, volume: number, from: number, to: number) {
    const ctx = this.ctx!;
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(from, when);
    filter.frequency.exponentialRampToValueAtTime(to, when + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    source.connect(filter).connect(gain).connect(this.sfxBus);
    source.start(when);
  }

  play(name: Sfx, index = 0) {
    if (!this.sfxOn || !this.ctx || !this.active) return;
    const t = this.ctx.currentTime + 0.005;
    switch (name) {
      case 'tile': {
        const note = TILE_NOTES[Math.min(index, TILE_NOTES.length - 1)]!;
        this.pluck(this.sfxBus, note, t, 0.55, 0.9, 0.6);
        break;
      }
      case 'word':
        [72, 76, 79, 84].forEach((n, i) =>
          this.pluck(this.sfxBus, n, t + i * 0.06, 0.45, 1.1, 0.6),
        );
        break;
      case 'bonus':
        [84, 88, 91, 96].forEach((n, i) =>
          this.tone(mtof(n), t + i * 0.05, 0.25, 0.12, 'triangle'),
        );
        break;
      case 'bad':
        this.tone(220, t, 0.18, 0.18, 'square', 140);
        this.tone(110, t, 0.2, 0.12, 'sine', 80);
        break;
      case 'repeat':
        this.tone(mtof(76), t, 0.1, 0.12, 'triangle');
        this.tone(mtof(76), t + 0.12, 0.12, 0.1, 'triangle');
        break;
      case 'coin':
        for (let i = 0; i < Math.max(1, Math.min(index, 6)); i++) {
          const at = t + i * 0.07;
          this.tone(1568, at, 0.12, 0.08, 'square');
          this.tone(2093, at + 0.04, 0.22, 0.08, 'sine');
        }
        break;
      case 'bell':
        this.tone(1318, t, 1.4, 0.14, 'sine');
        this.tone(1976, t, 0.9, 0.06, 'sine');
        this.tone(1318, t + 0.18, 1.2, 0.08, 'sine');
        break;
      case 'serve':
        [67, 72, 76, 79, 84].forEach((n, i) =>
          this.pluck(this.sfxBus, n, t + i * 0.08, 0.5, 1.4, 0.65),
        );
        break;
      case 'levelup':
        [60, 64, 67, 72, 76, 79, 84].forEach((n, i) =>
          this.pluck(this.sfxBus, n, t + i * 0.07, 0.5, 1.6, 0.7),
        );
        [72, 76, 79].forEach((n) => this.tone(mtof(n), t + 0.55, 1.2, 0.05, 'triangle'));
        break;
      case 'click':
        this.tone(900, t, 0.04, 0.08, 'triangle', 600);
        break;
      case 'page':
        this.pluck(this.sfxBus, 79 + (index % 3) * 2, t, 0.18, 0.4, 0.4);
        break;
      case 'shuffle':
        this.noise(t, 0.28, 0.25, 600, 3000);
        break;
      case 'hint':
        [81, 88].forEach((n, i) => this.tone(mtof(n), t + i * 0.09, 0.4, 0.09, 'sine'));
        break;
      case 'buy':
        this.play('coin', 3);
        [72, 79].forEach((n, i) => this.pluck(this.sfxBus, n, t + 0.15 + i * 0.1, 0.4, 1, 0.6));
        break;
    }
  }

  // ── Music ────────────────────────────────────────────────────────────────
  private startScheduler() {
    if (!this.ctx || !this.musicOn || !this.active || this.scheduler) return;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.scheduler = setInterval(() => this.scheduleAhead(), 60);
  }

  private stopScheduler() {
    clearInterval(this.scheduler);
    this.scheduler = undefined;
  }

  private scheduleAhead() {
    const ctx = this.ctx;
    if (!ctx) return;
    while (this.nextTime < ctx.currentTime + 0.25) {
      this.scheduleEighth(this.step, this.nextTime);
      this.nextTime += EIGHTH;
      this.step++;
    }
  }

  private rhythm: number[] = RHYTHMS[0]!;

  private scheduleEighth(step: number, when: number) {
    const bar = Math.floor(step / 6);
    const beat = step % 6;
    const phrase = bar % 16;
    const harmony = PROGRESSION[bar % PROGRESSION.length]!;
    if (beat === 0) this.rhythm = RHYTHMS[Math.floor(Math.random() * RHYTHMS.length)]!;
    const bus = this.musicBus;

    // Bass on the two big beats of 6/8.
    if (beat === 0) this.pluck(bus, harmony.bass, when, 0.55, 1.4, 0.35);
    if (beat === 3) this.pluck(bus, harmony.bass + 7, when, 0.35, 1.0, 0.35);
    // A soft strum.
    if (beat === 0 || beat === 3) {
      harmony.chord.forEach((n, i) =>
        this.pluck(bus, n - 12, when + i * 0.018, beat === 0 ? 0.22 : 0.14, 1.1, 0.4),
      );
    }
    // Melody rests every fourth phrase bar to breathe.
    if (phrase % 4 === 3 && beat > 2) return;
    if (!this.rhythm[beat]) return;
    const scale = harmony.scale;
    let note: number;
    if (beat === 0 || beat === 3) {
      const tones = harmony.chord.flatMap((n) => [n, n + 12]);
      note = tones.reduce((best, n) =>
        Math.abs(n - this.melodyNote) < Math.abs(best - this.melodyNote) ? n : best,
      );
    } else {
      const index = scale.reduce(
        (best, n, i) =>
          Math.abs(n - this.melodyNote) < Math.abs(scale[best]! - this.melodyNote) ? i : best,
        0,
      );
      const move = Math.random() < 0.5 ? 1 : -1;
      note = scale[Math.max(0, Math.min(scale.length - 1, index + move))]!;
    }
    if (note > 79) note -= 12;
    if (note < 62) note += 12;
    this.melodyNote = note;
    this.pluck(bus, note, when, beat === 0 ? 0.42 : 0.3, 0.9, 0.55);
  }
}

export const audio = new AudioEngine();
