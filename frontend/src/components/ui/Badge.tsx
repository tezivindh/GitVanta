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

  // One quiet style for every badge; the icon and name tell them apart.
  void variant;
  const variantStyles = {
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-primary-700 dark:text-primary-300',
  };

  const sizes = {
    sm: { container: 'w-10 h-10', icon: 'w-5 h-5' },
    md: { container: 'w-14 h-14', icon: 'w-7 h-7' },
    lg: { container: 'w-20 h-20', icon: 'w-10 h-10' },
  };

  const sizeStyles = sizes[size];

  return (
    <div className={clsx('relative group', className)}>
      <div
        className={clsx(
          'flex items-center justify-center rounded-lg border',
          variantStyles.bg,
          variantStyles.border,
          sizeStyles.container
        )}
      >
        <Icon className={clsx(sizeStyles.icon, variantStyles.text)} />
      </div>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
            <div className="font-semibold">{name}</div>
            {description && (
              <div className="text-gray-300 mt-0.5">{description}</div>
            )}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900" />
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
