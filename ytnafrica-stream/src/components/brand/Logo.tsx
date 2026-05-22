import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

interface LogoProps {
  className?: string;
  linkTo?: string;
  onClick?: () => void;
}

export function Logo({ className, linkTo = '/', onClick }: LogoProps) {
  const img = (
    <img
      src={logo}
      alt="YTN Africa"
      className={cn(
        'h-9 sm:h-10 md:h-11 w-auto max-w-[160px] sm:max-w-[180px] object-contain object-left',
        'select-none',
        className
      )}
      draggable={false}
    />
  );

  if (onClick) {
    return (
      <Link to={linkTo} onClick={onClick} className="inline-flex items-center shrink-0 min-w-0">
        {img}
      </Link>
    );
  }

  return (
    <Link to={linkTo} className="inline-flex items-center shrink-0 min-w-0 group">
      {img}
    </Link>
  );
}
