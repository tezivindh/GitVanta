import React from 'react';
import clsx from 'clsx';
import { Award, Star, Zap, Trophy, Code, Heart, Users, Book, Flame, Shield } from 'lucide-react';

type BadgeVariant = 'gold' | 'silver' | 'bronze' | 'special';
type BadgeIcon = 'award' | 'star' | 'zap' | 'trophy' | 'code' | 'heart' | 'users' | 'book' | 'flame' | 'shield';

interface BadgeProps {
  name: string;
  description?: string;
  variant?: BadgeVariant;
  icon?: BadgeIcon;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const iconMap = {
  award: Award,
  star: Star,
  zap: Zap,
  trophy: Trophy,
  code: Code,
  heart: Heart,
  users: Users,
  book: Book,
  flame: Flame,
  shield: Shield,
};

const Badge: React.FC<BadgeProps> = ({
  name,
  description,
  variant = 'bronze',
  icon = 'award',
  size = 'md',
  showTooltip = true,
  className,
}) => {
  const Icon = iconMap[icon];

  // One style for every badge: a chip in the Console language, tinted
  // accent-soft because a badge is something the person earned.
  void variant;
  const tooltipId = React.useId();

  const sizes = {
    sm: { container: 'w-10 h-10', icon: 'w-5 h-5' },
    md: { container: 'w-14 h-14', icon: 'w-7 h-7' },
    lg: { container: 'w-20 h-20', icon: 'w-10 h-10' },
  };

  const sizeStyles = sizes[size];

  return (
    <div className={clsx('relative', className)}>
      <div
        tabIndex={showTooltip ? 0 : undefined}
        aria-label={showTooltip ? name : undefined}
        aria-describedby={showTooltip ? tooltipId : undefined}
        className={clsx(
          'peer flex items-center justify-center rounded-chip border border-rule bg-accent-soft',
          sizeStyles.container
        )}
      >
        <Icon className={clsx(sizeStyles.icon, 'text-accent')} aria-hidden="true" />
      </div>

      {/* Tooltip: waits on hover, shows at once on keyboard focus. */}
      {showTooltip && (
        <div
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-[600] mb-2 -translate-x-1/2 opacity-0 transition-opacity delay-0 duration-[120ms] ease-out peer-hover:opacity-100 peer-hover:delay-[800ms] peer-focus-visible:opacity-100 peer-focus-visible:delay-0"
        >
          <div className="whitespace-nowrap rounded-pill border border-rule bg-paper-2 px-3 py-2 text-xs text-ink">
            <div className="font-medium">{name}</div>
            {description && <div className="mt-0.5 text-muted">{description}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

// Badge list component for displaying multiple badges
interface BadgeListProps {
  badges: Array<{
    name: string;
    description?: string;
    variant?: BadgeVariant;
    icon?: BadgeIcon;
  }>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BadgeList: React.FC<BadgeListProps> = ({
  badges,
  size = 'md',
  className,
}) => {
  return (
    <div className={clsx('flex flex-wrap gap-3', className)}>
      {badges.map((badge, index) => (
        <Badge
          key={index}
          name={badge.name}
          description={badge.description}
          variant={badge.variant}
          icon={badge.icon}
          size={size}
        />
      ))}
    </div>
  );
};

export default Badge;
