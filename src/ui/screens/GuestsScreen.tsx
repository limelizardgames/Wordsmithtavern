import { useState } from 'preact/hooks';
import { playDialogue, save, screen } from '../../app/state';
import { CONTENT } from '../../content';
import { guestProgress, isGuestUnlocked } from '../../game/night';
import type { GuestDef } from '../../game/types';
import { Icon, RecipeIcon } from '../art/Icons';
import { Portrait } from '../art/Portrait';
import { Button, IconButton } from '../components/Button';
import { CoinPill } from '../components/Hud';
import { Hearts } from '../components/Stars';
import './screens.css';

const FRIENDSHIP_STEPS = [1, 3, 6, 10, 15];
const heartsFor = (friendship: number) => FRIENDSHIP_STEPS.filter((n) => friendship >= n).length;

function GuestDetail({ guest }: { guest: GuestDef }) {
  const progress = guestProgress(save.value, guest.id);
  const told = guest.story.slice(0, progress.chapter);
  return (
    <div class="guest-detail">
      <div class="guest-hero panel">
        <div class="guest-hero-portrait">
          <Portrait spec={guest.portrait} mood="happy" />
        </div>
        <div class="guest-hero-text">
          <h2 class="panel-title guest-name">{guest.name}</h2>
          <div class="muted">{guest.title}</div>
          <Hearts value={heartsFor(progress.friendship)} size={18} />
          <p class="guest-bio">{guest.bio}</p>
          <div class="guest-favs">
            <span class="muted">Favourites:</span>
            {guest.favorites.map((id) => {
              const r = CONTENT.recipes.get(id);
              return r ? (
                <span class="tag" title={r.name}>
                  <RecipeIcon id={r.icon} size={18} /> {r.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      </div>
      <h3 class="section-title">Tales</h3>
      <ol class="tales">
        {guest.story.map((chapter, i) => {
          const unlocked = i < told.length;
          return (
            <li class={`tale panel ${unlocked ? '' : 'is-locked'}`}>
              <span class="tale-num">{i + 1}</span>
              <span class="tale-title">{unlocked ? chapter.title : '???'}</span>
              {unlocked ? (
                <Button
                  size="sm"
                  icon="scroll"
                  onClick={() =>
                    void playDialogue(
                      [
                        ...chapter.arrive,
                        {
                          speaker: 'guest',
                          text: chapter.order.replaceAll('{recipe}', 'the usual'),
                        },
                        ...chapter.done,
                      ],
                      guest,
                    )
                  }
                >
                  Read
                </Button>
              ) : (
                <Icon name="lock" size={18} />
              )}
            </li>
          );
        })}
      </ol>
      {progress.chapter >= guest.story.length && (
        <p class="muted center">Their tale is told. They still pop in for a chat.</p>
      )}
    </div>
  );
}

export function GuestsScreen() {
  const [open, setOpen] = useState<string | null>(null);
  const s = save.value;
  const guest = open ? CONTENT.guests.get(open) : undefined;
  const met = CONTENT.guestList.filter((g) => guestProgress(s, g.id).visits > 0).length;

  return (
    <div class="screen guests">
      <header class="hud">
        <IconButton
          icon="back"
          label="Back to the tavern"
          onClick={() => (open ? setOpen(null) : (screen.value = 'hub'))}
        />
        <div class="hud-title">
          <div class="hud-title-main">Guest Book</div>
          <div class="hud-title-sub">
            {met} of {CONTENT.guestList.length} regulars met
          </div>
        </div>
        <CoinPill />
      </header>
      <div class="list">
        {guest ? (
          <GuestDetail guest={guest} />
        ) : (
          <div class="guest-grid">
            {CONTENT.guestList.map((g) => {
              const p = guestProgress(s, g.id);
              const known = p.visits > 0;
              const coming = !known && isGuestUnlocked(g, s, CONTENT);
              return (
                <button
                  class={`guest-card panel ${known ? '' : 'is-unknown'}`}
                  onClick={() => known && setOpen(g.id)}
                  disabled={!known}
                >
                  <div class="guest-card-portrait">
                    <Portrait spec={g.portrait} silhouette={!known} />
                  </div>
                  {known ? (
                    <>
                      <div class="guest-card-name">{g.name}</div>
                      <Hearts value={heartsFor(p.friendship)} size={13} />
                      <div class="guest-card-tales muted">
                        Tale {Math.min(p.chapter, g.story.length)}/{g.story.length}
                      </div>
                    </>
                  ) : (
                    <>
                      <div class="guest-card-name">???</div>
                      <div class="guest-card-rumor muted">
                        {coming ? 'Arriving soon…' : g.rumor}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div class="banner-spacer" />
    </div>
  );
}
