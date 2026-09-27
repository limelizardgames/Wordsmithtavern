import { Icon } from '../art/Icons';

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span class="stars" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon name={i <= Math.round(value) ? 'star' : 'starEmpty'} size={size} />
      ))}
    </span>
  );
}

export function Hearts({
  value,
  max = 5,
  size = 16,
}: {
  value: number;
  max?: number;
  size?: number;
}) {
  return (
    <span class="hearts" aria-label={`Friendship ${value} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <Icon name={i < value ? 'heart' : 'heartEmpty'} size={size} />
      ))}
    </span>
  );
}
