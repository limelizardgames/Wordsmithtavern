import { feedback, selection, submit } from '../../app/service';
import { audio } from '../../services/audio';
import { Icon } from '../art/Icons';
import { wordFrom } from './LetterWheel';
import './preview.css';

/** The word being forged, plus a flash of feedback after each attempt. */
export function WordPreview({ letters, disabled }: { letters: string[]; disabled: boolean }) {
  const picked = selection.value;
  const word = wordFrom(letters, picked);
  const f = feedback.value;

  return (
    <div class="preview" aria-live="polite">
      {picked.length > 0 ? (
        <div class="preview-row">
          <button
            class="preview-btn is-clear"
            onClick={() => {
              selection.value = [];
              audio.play('click');
            }}
            aria-label="Clear letters"
          >
            <Icon name="close" size={18} />
          </button>
          <div class="preview-word">
            {word.split('').map((ch, i) => (
              <span class="preview-tile" key={`${i}-${ch}`}>
                {ch.toUpperCase()}
              </span>
            ))}
          </div>
          <button
            class="preview-btn is-go"
            disabled={disabled}
            onClick={() => {
              selection.value = [];
              submit(word);
            }}
            aria-label={`Serve the word ${word}`}
          >
            <Icon name="check" size={20} />
          </button>
        </div>
      ) : f ? (
        <div key={f.id} class={`preview-feedback is-${f.kind}`}>
          {f.text}
        </div>
      ) : (
        <div class="preview-hint">Swipe or tap the letters</div>
      )}
    </div>
  );
}
