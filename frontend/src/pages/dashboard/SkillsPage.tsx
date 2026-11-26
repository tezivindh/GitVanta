import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Brain } from 'lucide-react';
import { EmptyState, PageHeader } from '../../components/ui';
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

/** Skills by number of projects: a measurement, so one cool hue on a shared baseline. Widths are static. */
const SkillBars: React.FC<{ skills: ExtractedSkill[] }> = ({ skills }) => {
  const max = Math.max(1, ...skills.map((s) => s.projectCount));
  return (
    <ul className="divide-y divide-rule">
      {skills.map((s) => (
        <li key={s.name} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 py-2 text-sm sm:grid-cols-[10rem_1fr_6.5rem]">
          <span className="truncate text-ink" title={s.name}>
            {s.name}
          </span>
          <span className="h-1.5 rounded-chip bg-heat-0" aria-hidden="true">
            <span className="block h-1.5 rounded-chip ramp-cool" style={{ width: `${(s.projectCount / max) * 100}%` }} />
          </span>
          <span className="text-right text-muted">
            <span className="measured text-ink-2">{s.projectCount}</span> {s.projectCount === 1 ? 'project' : 'projects'}
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
          description="Skills come from your repositories’ languages and topics. Add topics to your repos, then analyse again."
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Skills"
        description={`${skills.length} skills detected from the languages and topics in your repositories.`}
      />

      {/* Category filter: a row of state chips, the chosen one on the cool tint. */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
        {(['all', ...byCategory.map((g) => g.key)] as const).map((key) => {
          const count = key === 'all' ? skills.length : byCategory.find((g) => g.key === key)!.skills.length;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={category === key}
              onClick={() => setCategory(key)}
              className={clsx(
                'relative inline-flex h-8 items-center gap-1.5 rounded-chip border px-2.5 text-sm transition-[background-color,color,border-color] duration-[120ms] ease-out after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-[""] pointer-coarse:after:-inset-y-2',
                category === key
                  ? 'border-rule-2 bg-cool-soft text-ink'
                  : 'border-rule bg-paper-2 text-ink-2 hover:border-rule-2 hover:text-ink'
              )}
            >
              {key === 'all' ? 'All' : CATEGORY_LABELS[key]}
              <span className="measured text-xs text-muted">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="panels lg:grid-cols-5">
        <section className="p-5 lg:col-span-3" aria-labelledby="skills-most">
          <h2 id="skills-most" className="max-w-none text-md font-medium tracking-[-0.01em] text-ink">
            Used in the most projects
          </h2>
          <div className="mt-3">
            <SkillBars skills={visible.slice(0, 12)} />
          </div>
        </section>

        <section className="p-5 lg:col-span-2" aria-labelledby="skills-proficiency">
          <h2 id="skills-proficiency" className="max-w-none text-md font-medium tracking-[-0.01em] text-ink">
            By proficiency
          </h2>
          <p className="mt-1 text-sm text-muted">Estimated from how many projects use each skill.</p>
          <dl className="mt-4 divide-y divide-rule">
            {(['expert', 'advanced', 'intermediate', 'beginner'] as const).map((level) => {
              const names = visible.filter((s) => s.proficiency === level).map((s) => s.name);
              if (names.length === 0) return null;
              return (
                <div key={level} className="py-2.5 first:pt-0">
                  <dt className="flex items-baseline justify-between gap-3 text-sm font-medium text-ink">
                    {PROFICIENCY_LABEL[level]}
                    <span className="measured text-xs font-normal text-muted">({names.length})</span>
                  </dt>
                  <dd className="mt-1 text-sm text-ink-2">{names.join(', ')}</dd>
                </div>
              );
            })}
          </dl>
        </section>
      </div>

      <div className="panels sm:grid-cols-2 xl:grid-cols-3">
        {byCategory
          .filter((g) => category === 'all' || g.key === category)
          .map((g) => (
            <section key={g.key} className="p-5">
              <h2 className="flex max-w-none items-baseline justify-between gap-3 text-sm font-medium text-ink">
                {CATEGORY_LABELS[g.key]}
                <span className="measured text-xs font-normal text-muted">{g.skills.length}</span>
              </h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {g.skills.map((s) => (
                  <li
                    key={s.name}
                    className="rounded-chip border border-rule bg-paper-3 px-2 py-0.5 text-sm text-ink-2"
                    title={`${PROFICIENCY_LABEL[s.proficiency]}, ${s.projectCount} projects`}
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </div>
    </div>
  );
};

export default SkillsPage;
