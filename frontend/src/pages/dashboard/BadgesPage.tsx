// =====================================================
// BADGES PAGE - Achievement badges display
// =====================================================

import React from 'react';
import { Trophy, Lock } from 'lucide-react';
import { useAnalysisStore } from '../../store/analysisStore';
import { Card, CardHeader, Alert, Badge as BadgeComponent } from '../../components/ui';

// Available badges with their criteria
const allBadges = [
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
    description: 'Uses multiple programming languages',
    icon: 'code' as const,
    variant: 'gold' as const,
    criteria: 'Use 5+ different programming languages',
  },
  {
    id: 'consistent',
    name: 'Consistent Coder',
    description: 'Regular commit activity',
    icon: 'flame' as const,
    variant: 'silver' as const,
    criteria: 'Maintain regular commit activity over time',
  },
  {
    id: 'documenter',
    name: 'Great Documenter',
    description: 'Well-documented repositories',
    icon: 'book' as const,
    variant: 'silver' as const,
    criteria: 'Have README files in most repositories',
  },
  {
    id: 'popular',
    name: 'Popular Developer',
    description: 'Repositories with many stars',
    icon: 'star' as const,
    variant: 'gold' as const,
    criteria: 'Earn 100+ stars across repositories',
  },
  {
    id: 'community',
    name: 'Community Member',
    description: 'Active in the community',
    icon: 'users' as const,
    variant: 'bronze' as const,
    criteria: 'Have forks and community engagement',
  },
  {
    id: 'professional',
    name: 'Professional Profile',
    description: 'Complete GitHub profile',
    icon: 'shield' as const,
    variant: 'bronze' as const,
    criteria: 'Have bio, avatar, and complete profile',
  },
  {
    id: 'innovative',
    name: 'Innovator',
    description: 'Creates diverse projects',
    icon: 'zap' as const,
    variant: 'special' as const,
    criteria: 'Have projects across different domains',
  },
  {
    id: 'mentor',
    name: 'Mentor',
    description: 'Helps others learn',
    icon: 'trophy' as const,
    variant: 'special' as const,
    criteria: 'Create educational or tutorial projects',
  },
];

const BadgesPage: React.FC = () => {
  const { currentReport } = useAnalysisStore();

  const earnedBadges = currentReport?.result.badges || [];
  const badgesSet = new Set(earnedBadges.map((b) => b.toLowerCase()));

  // Check if a badge is earned (simple string matching)
  const isBadgeEarned = (badgeId: string, badgeName: string): boolean => {
    return (
      badgesSet.has(badgeId) ||
      badgesSet.has(badgeName.toLowerCase()) ||
      earnedBadges.some(
        (b) =>
          b.toLowerCase().includes(badgeId) ||
          badgeName.toLowerCase().includes(b.toLowerCase())
      )
    );
  };

  if (!currentReport) {
    return (
      <Alert variant="info" title="No Analysis Found">
        Run an analysis from the dashboard to see your badges.
      </Alert>
    );
  }

  const earned = allBadges.filter((badge) =>
    isBadgeEarned(badge.id, badge.name)
  );
  const locked = allBadges.filter(
    (badge) => !isBadgeEarned(badge.id, badge.name)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Badges</h1>
        <p className="text-gray-500 mt-1">
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
                <h3 className="font-medium text-gray-900 mt-3">{badge.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{badge.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No badges earned yet. Keep improving your portfolio!
          </p>
        )}
      </Card>

      {/* Locked Badges */}
      <Card>
        <CardHeader
          title="Badges to Earn"
          icon={<Lock className="w-5 h-5 text-gray-400" />}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {locked.map((badge) => (
            <div
              key={badge.id}
              className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg opacity-60"
            >
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{badge.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{badge.description}</p>
                <p className="text-xs text-gray-400 mt-2">
                  How to earn: {badge.criteria}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Raw badges from analysis */}
      {earnedBadges.length > 0 && (
        <Card>
          <CardHeader title="All Detected Achievements" />
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map((badge, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium"
              >
                {badge}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default BadgesPage;
