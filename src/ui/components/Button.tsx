import type { ButtonHTMLAttributes, ComponentChildren } from 'preact';
import { audio } from '../../services/audio';
import { haptics } from '../../services/haptics';
import { Icon, type UiIconName } from '../art/Icons';

type Variant = 'gold' | 'wood' | 'green' | 'ghost' | 'red';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'icon' | 'size'> {
  variant?: Variant;
  icon?: UiIconName;
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  children?: ComponentChildren;
  /** Skip the default click sound (for buttons that make their own). */
  silent?: boolean;
}

export function Button({
  variant = 'wood',
  icon,
  size = 'md',
  block,
  children,
  silent,
  onClick,
  class: className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      class={['btn', `btn-${variant}`, `btn-${size}`, block && 'btn-block', className]
        .filter(Boolean)
        .join(' ')}
      onClick={(e) => {
        if (!silent) audio.play('click');
        haptics.tick();
        onClick?.(e);
      }}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 26 : size === 'sm' ? 18 : 22} />}
      {children && <span class="btn-label">{children}</span>}
    </button>
  );
}

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'icon'> {
  icon: UiIconName;
  label: string;
  badge?: string | number;
}

export function IconButton({
  icon,
  label,
  badge,
  onClick,
  class: className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      class={['icon-btn', className].filter(Boolean).join(' ')}
      aria-label={label}
      title={label}
      onClick={(e) => {
        audio.play('click');
        haptics.tick();
        onClick?.(e);
      }}
      {...rest}
    >
      <Icon name={icon} size={24} />
      {badge !== undefined && <span class="icon-btn-badge">{badge}</span>}
    </button>
  );
}
