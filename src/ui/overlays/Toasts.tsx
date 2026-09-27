import { toasts } from '../../app/state';
import { Icon } from '../art/Icons';

export function Toasts() {
  return (
    <div class="toasts" aria-live="polite">
      {toasts.value.map((t) => (
        <div class="toast" key={t.id}>
          {t.icon && <Icon name={t.icon} size={20} />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
