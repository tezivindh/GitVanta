// =====================================================
// BADGE COMPONENT - Display achievement badges
// =====================================================

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

  const variants = {
    gold: {
      bg: 'bg-linear-to-br from-yellow-400 to-yellow-600',
      border: 'border-yellow-500',
      text: 'text-yellow-900',
      glow: 'shadow-yellow-500/50',
    },
    silver: {
      bg: 'bg-linear-to-br from-gray-300 to-gray-500',
      border: 'border-gray-400',
      text: 'text-gray-900',
      glow: 'shadow-gray-500/50',
    },
    bronze: {
      bg: 'bg-linear-to-br from-orange-400 to-orange-600',
      border: 'border-orange-500',
      text: 'text-orange-900',
      glow: 'shadow-orange-500/50',
    },
    special: {
      bg: 'bg-linear-to-br from-purple-400 to-purple-600',
      border: 'border-purple-500',
      text: 'text-purple-900',
      glow: 'shadow-purple-500/50',
    },
  };

  const sizes = {
    sm: { container: 'w-10 h-10', icon: 'w-5 h-5' },
    md: { container: 'w-14 h-14', icon: 'w-7 h-7' },
    lg: { container: 'w-20 h-20', icon: 'w-10 h-10' },
  };

  const variantStyles = variants[variant];
  const sizeStyles = sizes[size];

  return (
    <div className={clsx('relative group', className)}>
      <div
        className={clsx(
          'rounded-full flex items-center justify-center',
          'border-2 shadow-lg',
          variantStyles.bg,
          variantStyles.border,
          variantStyles.glow,
          sizeStyles.container,
          'transform transition-transform hover:scale-110'
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
