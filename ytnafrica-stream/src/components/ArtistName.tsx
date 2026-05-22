import { Link } from 'react-router-dom';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { cn } from '@/lib/utils';

interface ArtistNameProps {
  name: string;
  artistId?: number | null;
  verified?: boolean;
  className?: string;
  linkClassName?: string;
}

export function ArtistName({ name, artistId, verified, className, linkClassName }: ArtistNameProps) {
  const content = (
    <span className={cn('inline-flex items-center gap-1 min-w-0', className)}>
      <span className="truncate">{name}</span>
      <VerifiedBadge verified={verified} />
    </span>
  );

  if (artistId) {
    return (
      <Link
        to={`/artists/${artistId}`}
        onClick={(e) => e.stopPropagation()}
        className={cn('hover:text-accent transition-colors', linkClassName)}
      >
        {content}
      </Link>
    );
  }

  return content;
}
