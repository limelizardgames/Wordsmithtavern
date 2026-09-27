import { useEffect, useState } from 'preact/hooks';
import { advanceDialogue, dialogue } from '../../app/state';
import { BARLEY } from '../../content/barley';
import { audio } from '../../services/audio';
import { Barley } from '../art/Barley';
import { Portrait } from '../art/Portrait';

const CHAR_MS = 22;

/** Story conversations: tap to finish the line, tap again for the next one. */
export function DialogueOverlay() {
  const d = dialogue.value;
  const [shown, setShown] = useState(0);
  const line = d?.lines[d.index];
  const text = line?.text ?? '';

  useEffect(() => {
    setShown(0);
    if (!line) return;
    audio.play('page', d?.index ?? 0);
    let n = 0;
    const timer = setInterval(() => {
      n += 1;
      setShown(n);
      if (n >= text.length) clearInterval(timer);
    }, CHAR_MS);
    return () => clearInterval(timer);
  }, [d?.lines, d?.index]);

  if (!d || !line) return null;
  const typing = shown < text.length;
  const isBarley = line.speaker === 'barley';

  const onTap = () => {
    if (typing) setShown(text.length);
    else advanceDialogue();
  };

  return (
    <div class="dialogue" onClick={onTap} role="dialog" aria-live="polite">
      <div class="dialogue-card panel">
        <div class="dialogue-portrait">
          {isBarley ? (
            <Barley class="barley-art" mood={line.mood ?? 'neutral'} talking={typing} />
          ) : d.guestSpec ? (
            <Portrait spec={d.guestSpec} mood={line.mood ?? 'neutral'} talking={typing} />
          ) : null}
        </div>
        <div>
          <div class="dialogue-name">
            {isBarley ? BARLEY.name : d.guestName}
            <small>{isBarley ? BARLEY.title : d.guestTitle}</small>
          </div>
          <p class="dialogue-text">
            {text.slice(0, shown)}
            <span style={{ opacity: 0 }}>{text.slice(shown)}</span>
          </p>
        </div>
        {!typing && <span class="dialogue-next">tap ▾</span>}
      </div>
    </div>
  );
}
