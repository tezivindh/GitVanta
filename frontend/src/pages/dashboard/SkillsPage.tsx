import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Brain } from 'lucide-react';
import { Card, EmptyState, PageHeader } from '../../components/ui';
import AnalysisGate from '../../components/AnalysisGate';
import { ExtractedSkill } from '../../types';

const CATEGORY_LABELS: Record<ExtractedSkill['category'], string> = {
  language: 'Languages',
  framework: 'Frameworks',
  tool: 'Tools',
  database: 'Databases',
  cloud: 'Cloud',
  other: 'Other',
};
const CATEGORY_ORDER: ExtractedSkill['category'][] = ['language', 'framework', 'database', 'cloud', 'tool', 'other'];

const PROFICIENCY_LABEL: Record<ExtractedSkill['proficiency'], string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

/** Skills by number of projects: one hue, shared baseline. */
const SkillBars: React.FC<{ skills: ExtractedSkill[] }> = ({ skills }) => {
  const max = Math.max(1, ...skills.map((s) => s.projectCount));
  return (
    <ul className="space-y-3">
      {skills.map((s) => (
        <li key={s.name} className="grid grid-cols-[8rem_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[10rem_1fr_auto]">
          <span className="truncate text-gray-800 dark:text-gray-200" title={s.name}>
            {s.name}
          </span>
          <span className="h-2 rounded-full bg-gray-100 dark:bg-gray-800" aria-hidden="true">
            <span className="block h-2 rounded-full bg-primary-500" style={{ width: `${(s.projectCount / max) * 100}%` }} />
          </span>
          <span className="tabular-nums text-gray-600 dark:text-gray-400">
            {s.projectCount} {s.projectCount === 1 ? 'project' : 'projects'}
          </span>
        </li>
      ))}
    </ul>
  );
};

const SkillsPage: React.FC = () => {
  const [category, setCategory] = useState<ExtractedSkill['category'] | 'all'>('all');

  return (
    <AnalysisGate header={<PageHeader title="Skills" />}>
      {(a) => <SkillsContent skills={a.skills} category={category} setCategory={setCategory} />}
    </AnalysisGate>
  );
};

const SkillsContent: React.FC<{
  skills: ExtractedSkill[];
  category: ExtractedSkill['category'] | 'all';
  setCategory: (c: ExtractedSkill['category'] | 'all') => void;
}> = ({ skills, category, setCategory }) => {
  const byCategory = useMemo(() => {
    const groups = new Map<ExtractedSkill['category'], ExtractedSkill[]>();
    for (const s of skills) groups.set(s.category, [...(groups.get(s.category) ?? []), s]);
    return CATEGORY_ORDER.filter((c) => groups.has(c)).map((c) => ({
      key: c,
      skills: groups.get(c)!.sort((x, y) => y.projectCount - x.projectCount),
    }));
  }, [skills]);

  const visible = (category === 'all' ? skills : skills.filter((s) => s.category === category))
    .slice()
    .sort((x, y) => y.projectCount - x.projectCount);

  if (skills.length === 0) {
    return (
      <>
        <PageHeader title="Skills" />
        <EmptyState
          icon={Brain}
          title="No skills detected yet"
          description="Skills come from your repositories' languages and topics. Add topics to your repos, then analyse again."
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skills"
        description={`${skills.length} skills detected from the languages and topics in your repositories.`}
      />

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
        {(['all', ...byCategory.map((g) => g.key)] as const).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={category === key}
            onClick={() => setCategory(key)}
            className={clsx(
              'rounded-full px-3 py-1 text-sm',
              category === key
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'border border-gray-200 text-gray-700 hover:bg-white dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900'
            )}
          >
            {key === 'all' ? `All (${skills.length})` : `${CATEGORY_LABELS[key]} (${byCategory.find((g) => g.key === key)!.skills.length})`}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Used in the most projects</h2>
          <div className="mt-4">
            <SkillBars skills={visible.slice(0, 12)} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">By proficiency</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Estimated from how many projects use each skill.</p>
          <dl className="mt-4 space-y-3">
            {(['expert', 'advanced', 'intermediate', 'beginner'] as const).map((level) => {
              const names = visible.filter((s) => s.proficiency === level).map((s) => s.name);
              if (names.length === 0) return null;
              return (
                <div key={level}>
                  <dt className="text-sm font-medium text-gray-900 dark:text-white">
                    {PROFICIENCY_LABEL[level]} ({names.length})
                  </dt>
                  <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400">{names.join(', ')}</dd>
                </div>
              );
            })}
          </dl>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {byCategory
          .filter((g) => category === 'all' || g.key === category)
          .map((g) => (
            <Card key={g.key}>
              <h2 className="font-semibold text-gray-900 dark:text-white">{CATEGORY_LABELS[g.key]}</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {g.skills.map((s) => (
                  <li
                    key={s.name}
                    className="rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-800 dark:bg-primary-950 dark:text-primary-200"
                    title={`${PROFICIENCY_LABEL[s.proficiency]}, ${s.projectCount} projects`}
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default SkillsPage;
