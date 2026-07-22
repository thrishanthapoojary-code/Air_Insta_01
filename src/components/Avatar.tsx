import { avatarColor, initials, cn } from '../lib/utils';

type Props = {
  url?: string | null;
  name?: string | null;
  username?: string | null;
  size?: number;
  ring?: boolean;
  className?: string;
  onClick?: () => void;
};

export default function Avatar({ url, name, username, size = 40, ring, className, onClick }: Props) {
  const seed = username ?? name ?? 'x';
  const inner = (
    <div
      className={cn('relative overflow-hidden rounded-full', ring && 'avatar-ring')}
      style={{ width: size, height: size }}
    >
      <div className={cn('h-full w-full overflow-hidden rounded-full', ring && 'border-2 border-ig-surface')}>
        {url ? (
          <img src={url} alt={name ?? 'avatar'} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div
            className={cn(
              'flex h-full w-full items-center justify-center bg-gradient-to-br font-semibold text-white',
              avatarColor(seed),
            )}
            style={{ fontSize: size * 0.36 }}
          >
            {initials(name ?? username)}
          </div>
        )}
      </div>
    </div>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn('shrink-0', className)} aria-label={name ?? 'avatar'}>
        {inner}
      </button>
    );
  }
  return <div className={cn('shrink-0', className)}>{inner}</div>;
}
