import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  verified?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function VerifiedBadge({ verified, className, size = 'sm' }: VerifiedBadgeProps) {
  if (!verified) return null;
  const iconSize = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <BadgeCheck
      className={cn(iconSize, 'text-blue-500 fill-blue-500/20 shrink-0', className)}
      aria-label="Verified artist"
    />
  );
}
