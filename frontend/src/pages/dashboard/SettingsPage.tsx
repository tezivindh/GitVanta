import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { PageHeader } from '../../components/ui';
import AIProviderSection from '../../components/settings/AIProviderSection';
import ShowcaseSection from '../../components/settings/ShowcaseSection';
import AccountSection from '../../components/settings/AccountSection';
import { ExportSection } from './ExportPage';

type TabId = 'ai-provider' | 'public-profile' | 'export' | 'account';

const TABS: Array<{ id: TabId; label: string; description: string }> = [
  {
    id: 'ai-provider',
    label: 'AI provider',
    description: 'Choose which AI writes your README rewrites, resume bullets, summaries and roadmaps.',
  },
  {
    id: 'public-profile',
    label: 'Public profile',
    description: 'Choose which repositories appear on your public profile and professional view.',
  },
  {
    id: 'export',
    label: 'Export',
    description: 'Download your latest analysis as a PDF report or as JSON data.',
  },
  {
    id: 'account',
    label: 'Account',
    description: 'Export everything, end other sessions, or delete your account.',
  },
];

/** Older links point at a section that now lives inside another tab. */
const HASH_TO_TAB: Record<string, TabId> = { appearance: 'account' };

const tabId = (id: TabId) => `settings-tab-${id}`;
const panelId = (id: TabId) => `settings-panel-${id}`;

const SettingsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});

  // The open tab lives in the URL hash, so links like settings#ai-provider keep working.
  const hash = location.hash.replace('#', '');
  const active: TabId = HASH_TO_TAB[hash] ?? (TABS.some((t) => t.id === hash) ? (hash as TabId) : 'ai-provider');
  const current = TABS.find((t) => t.id === active)!;

  const open = (id: TabId, focus = false) => {
    navigate({ hash: `#${id}` }, { replace: true });
    if (focus) tabRefs.current[id]?.focus();
  };

  // Arrow keys, Home and End move between tabs (WAI-ARIA tabs pattern).
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = TABS.findIndex((t) => t.id === active);
    const next =
      e.key === 'ArrowRight' ? (i + 1) % TABS.length
      : e.key === 'ArrowLeft' ? (i - 1 + TABS.length) % TABS.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? TABS.length - 1
      : -1;
    if (next < 0) return;
    e.preventDefault();
    open(TABS[next].id, true);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your AI provider, public profile, exports and account." />

      <div
        role="tablist"
        aria-label="Settings sections"
        onKeyDown={onKeyDown}
        className="-mt-2 flex gap-1 overflow-x-auto overscroll-x-contain border-b border-rule [scrollbar-width:none]"
      >
        {TABS.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              ref={(el) => (tabRefs.current[t.id] = el)}
              id={tabId(t.id)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId(t.id)}
              tabIndex={selected ? 0 : -1}
              onClick={() => open(t.id)}
              className={clsx(
                'relative -mb-px h-10 shrink-0 whitespace-nowrap border-b-2 px-3 text-sm transition-colors duration-[120ms] ease-out pointer-coarse:h-11 focus-visible:outline-offset-[-2px]',
                selected ? 'border-accent font-medium text-ink' : 'border-transparent text-muted hover:text-ink active:text-ink'
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <section
        id={panelId(active)}
        role="tabpanel"
        aria-labelledby={tabId(active)}
        tabIndex={0}
        className="card grid gap-5 p-5 focus-visible:outline-offset-2 sm:p-6 min-[60rem]:grid-cols-[15rem_minmax(0,1fr)] min-[60rem]:gap-10"
      >
        <div>
          <h2 className="max-w-none text-md font-medium leading-snug tracking-[-0.01em] text-ink">{current.label}</h2>
          <p className="mt-1 text-sm text-muted">{current.description}</p>
        </div>
        <div className="min-w-0">
          {active === 'ai-provider' && <AIProviderSection />}
          {active === 'public-profile' && <ShowcaseSection />}
          {active === 'export' && <ExportSection />}
          {active === 'account' && (
<AccountSection />
          )}
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
