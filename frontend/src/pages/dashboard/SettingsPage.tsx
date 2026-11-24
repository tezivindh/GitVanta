import React from 'react';
import clsx from 'clsx';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useThemeStore, ThemeMode } from '../../store/themeStore';
import { PageHeader } from '../../components/ui';
import AIProviderSection from '../../components/settings/AIProviderSection';
import ShowcaseSection from '../../components/settings/ShowcaseSection';
import AccountSection from '../../components/settings/AccountSection';

const Section: React.FC<{ id: string; title: string; description: string; children: React.ReactNode }> = ({
  id,
  title,
  description,
  children,
}) => (
  <section id={id} aria-labelledby={`${id}-title`} className="card scroll-mt-24 p-5 sm:p-6">
    <h2 id={`${id}-title`} className="text-lg font-semibold text-gray-900 dark:text-white">
      {title}
    </h2>
    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
    <div className="mt-5">{children}</div>
  </section>
);

const THEMES: Array<{ mode: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
  { mode: 'system', label: 'Match system', icon: Monitor },
];

const SettingsPage: React.FC = () => {
  const { mode, setMode } = useThemeStore();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your AI provider, public profile, appearance and account." />

      <nav aria-label="Settings sections" className="flex flex-wrap gap-2 text-sm">
        {[
          ['#ai-provider', 'AI provider'],
          ['#public-profile', 'Public profile'],
          ['#appearance', 'Appearance'],
          ['#account', 'Account'],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="rounded-full border border-gray-200 px-3 py-1 text-gray-700 hover:bg-paper dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900"
          >
            {label}
          </a>
        ))}
      </nav>

      <Section
        id="ai-provider"
        title="AI provider"
        description="Choose which AI writes your README rewrites, resume bullets, summaries and roadmaps."
      >
        <AIProviderSection />
      </Section>

      <Section
        id="public-profile"
        title="Public profile"
        description="Choose which repositories appear on your public profile and professional view."
      >
        <ShowcaseSection />
      </Section>

      <Section id="appearance" title="Appearance" description="Pick a theme for GitVanta on this device.">
        <fieldset>
          <legend className="sr-only">Theme</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {THEMES.map(({ mode: m, label, icon: Icon }) => (
              <label
                key={m}
                className={clsx(
                  'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary-500',
                  mode === m
                    ? 'border-primary-500 bg-gray-100 text-primary-900 dark:bg-gray-800 dark:text-primary-100'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800/60'
                )}
              >
                <input type="radio" name="theme" value={m} checked={mode === m} onChange={() => setMode(m)} className="sr-only" />
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      </Section>

      <Section id="account" title="Account" description="Export your data, end other sessions, or delete your account.">
        <AccountSection />
      </Section>
    </div>
  );
};

export default SettingsPage;
