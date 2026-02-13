// =====================================================
// BADGES PAGE - Achievement badges display
// =====================================================

import React from 'react';
import { Trophy, Lock } from 'lucide-react';
import { useAnalysisStore } from '../../store/analysisStore';
import { Card, CardHeader, Alert, Badge as BadgeComponent } from '../../components/ui';

// All possible badges - IDs match exactly what the backend generates
const allBadges = [
  // === Core badges (easier to earn) ===
  {
    id: 'open-source',
    name: 'Open Source Contributor',
    description: 'Contributed to open source projects',
    icon: 'heart' as const,
    variant: 'gold' as const,
    criteria: 'Fork or contribute to open source repositories',
  },
  {
    id: 'polyglot',
    name: 'Polyglot',
    description: 'Uses 5+ programming languages',
    icon: 'code' as const,
    variant: 'gold' as const,
    criteria: 'Use 5+ different programming languages in your projects',
  },
  {
    id: 'consistent',
    name: 'Consistent Coder',
    description: 'Regular commit activity',
    icon: 'flame' as const,
    variant: 'silver' as const,
    criteria: 'Achieve an activity score of 60 or higher',
  },
  {
    id: 'documenter',
    name: 'Great Documenter',
    description: 'Well-documented repositories',
    icon: 'book' as const,
    variant: 'silver' as const,
    criteria: 'Achieve a documentation score of 70 or higher',
  },
  {
    id: 'popular',
    name: 'Popular Developer',
    description: 'Repositories with many stars',
    icon: 'star' as const,
    variant: 'gold' as const,
    criteria: 'Earn 50+ stars across your repositories',
  },
  {
    id: 'community',
    name: 'Community Member',
    description: 'Active in the developer community',
    icon: 'users' as const,
    variant: 'bronze' as const,
    criteria: 'Have 10+ followers, 5+ forks received, or 20+ stars',
  },
  {
    id: 'professional',
    name: 'Professional Profile',
    description: 'Complete GitHub profile',
    icon: 'shield' as const,
    variant: 'bronze' as const,
    criteria: 'Achieve professionalism score of 70+ or have a profile README',
  },
  {
    id: 'innovative',
    name: 'Innovator',
    description: 'Creates diverse projects',
    icon: 'zap' as const,
    variant: 'special' as const,
    criteria: 'Achieve a diversity score of 70 or higher',
  },
  {
    id: 'mentor',
    name: 'Mentor',
    description: 'Helps others learn',
    icon: 'trophy' as const,
    variant: 'special' as const,
    criteria: 'Create educational/tutorial projects or have 30+ repos',
  },
  // === Advanced badges (harder to earn) ===
  {
    id: 'quality-coder',
    name: 'Quality Coder',
    description: 'Code quality score of 70+',
    icon: 'award' as const,
    variant: 'silver' as const,
    criteria: 'Achieve a code quality score of 70 or higher',
  },
  {
    id: 'code-master',
    name: 'Code Master',
    description: 'Code quality score of 90+',
    icon: 'trophy' as const,
    variant: 'gold' as const,
    criteria: 'Achieve a code quality score of 90 or higher',
  },
  {
    id: 'documentation-hero',
    name: 'Documentation Hero',
    description: 'Documentation score of 90+',
    icon: 'book' as const,
    variant: 'gold' as const,
    criteria: 'Achieve a documentation score of 90 or higher',
  },
  {
    id: 'active-contributor',
    name: 'Active Contributor',
    description: 'Highly active developer',
    icon: 'flame' as const,
    variant: 'gold' as const,
    criteria: 'Achieve an activity score of 80 or higher',
  },
  {
    id: 'star-collector',
    name: 'Star Collector',
    description: 'Received 100+ stars',
    icon: 'star' as const,
    variant: 'gold' as const,
    criteria: 'Earn 100+ stars across your repositories',
  },
  {
    id: 'influencer',
    name: 'Influencer',
    description: '100+ followers',
    icon: 'users' as const,
    variant: 'gold' as const,
    criteria: 'Have 100 or more GitHub followers',
  },
  {
    id: 'builder',
    name: 'Builder',
    description: 'Created 20+ repositories',
    icon: 'award' as const,
    variant: 'silver' as const,
    criteria: 'Create 20 or more public repositories',
  },
  {
    id: 'prolific-creator',
    name: 'Prolific Creator',
    description: 'Created 50+ repositories',
    icon: 'zap' as const,
    variant: 'gold' as const,
    criteria: 'Create 50 or more public repositories',
  },
  {
    id: 'skilled-developer',
    name: 'Skilled Developer',
    description: 'Overall score of 75+',
    icon: 'award' as const,
    variant: 'silver' as const,
    criteria: 'Achieve an overall portfolio score of 75 or higher',
  },
  {
    id: 'elite-developer',
    name: 'Elite Developer',
    description: 'Overall score of 90+',
    icon: 'trophy' as const,
    variant: 'special' as const,
    criteria: 'Achieve an overall portfolio score of 90 or higher',
  },
];

// Create a lookup map for badge names by ID
// const badgeNameMap = new Map(allBadges.map(b => [b.id, b.name]));

const BadgesPage: React.FC = () => {
  const { currentReport, badges: fullBadgeObjects } = useAnalysisStore();

  // earnedBadgeIds contains badge IDs from the backend
  const earnedBadgeIds = currentReport?.result.badges || [];
  const earnedIdSet = new Set(earnedBadgeIds);

  // Check if a badge is earned by exact ID match
  const isBadgeEarned = (badgeId: string): boolean => {
    return earnedIdSet.has(badgeId);
  };

  if (!currentReport) {
    return (
      <Alert variant="info" title="No Analysis Found">
        Run an analysis from the dashboard to see your badges.
      </Alert>
    );
  }

  const earned = allBadges.filter((badge) => isBadgeEarned(badge.id));
  const locked = allBadges.filter((badge) => !isBadgeEarned(badge.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Badges</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {earned.length} of {allBadges.length} badges earned
        </p>
      </div>

      {/* Earned Badges */}
      <Card>
        <CardHeader
          title="Earned Badges"
          icon={<Trophy className="w-5 h-5 text-yellow-500" />}
        />
        {earned.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {earned.map((badge) => (
              <div key={badge.id} className="flex flex-col items-center text-center">
                <BadgeComponent
                  name={badge.name}
                  description={badge.description}
                  variant={badge.variant}
                  icon={badge.icon}
                  size="lg"
                />
                <h3 className="font-medium text-gray-900 dark:text-white mt-3">{badge.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{badge.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No badges earned yet. Keep improving your portfolio!
          </p>
        )}
      </Card>

      {/* Locked Badges */}
      {locked.length > 0 && (
        <Card>
          <CardHeader
            title="Badges to Earn"
            icon={<Lock className="w-5 h-5 text-gray-400" />}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {locked.map((badge) => (
              <div
                key={badge.id}
                className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg opacity-60"
              >
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{badge.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{badge.description}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    How to earn: {badge.criteria}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All Detected Achievements (shows full badge objects from store) */}
      {fullBadgeObjects.length > 0 && (
        <Card>
          <CardHeader title="All Detected Achievements" />
          <div className="flex flex-wrap gap-2">
            {fullBadgeObjects.map((badge, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm font-medium"
              >
                {badge.name}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default BadgesPage;
