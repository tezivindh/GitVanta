import { AnalyzedRepository, IUser } from '../types';

export interface ShowcaseRepo {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  isPrivate: boolean;
  /** null for private repos: viewers see them but can't open them. */
  url: string | null;
  homepage: string | null;
}

/**
 * Repos a visitor may see: public repos the owner hasn't hidden, plus
 * private repos the owner explicitly chose to show, stripped of links.
 * Private repos are never included unless opted in.
 */
export function visibleRepos(repos: AnalyzedRepository[] = [], user: Pick<IUser, 'profileSettings'>): ShowcaseRepo[] {
  const hidden = new Set(user.profileSettings?.hiddenRepos ?? []);
  const shownPrivate = new Set(user.profileSettings?.shownPrivateRepos ?? []);

  return repos
    .filter((r) => (r.isPrivate ? shownPrivate.has(r.name) : !hidden.has(r.name)))
    .map((r) => ({
      name: r.name,
      description: r.description ?? null,
      language: r.language ?? null,
      stars: r.stars ?? 0,
      forks: r.forks ?? 0,
      topics: r.topics ?? [],
      isPrivate: !!r.isPrivate,
      url: r.isPrivate ? null : r.url,
      homepage: r.isPrivate ? null : r.homepage ?? null,
    }));
}

/** Owner's view: every analyzed repo with whether visitors can see it. */
export function showcaseSettingsView(repos: AnalyzedRepository[] = [], user: Pick<IUser, 'profileSettings'>) {
  const visible = new Set(visibleRepos(repos, user).map((r) => r.name));
  return repos
    .map((r) => ({
      name: r.name,
      description: r.description ?? null,
      language: r.language ?? null,
      stars: r.stars ?? 0,
      isPrivate: !!r.isPrivate,
      visible: visible.has(r.name),
    }))
    .sort((a, b) => Number(a.isPrivate) - Number(b.isPrivate) || b.stars - a.stars || a.name.localeCompare(b.name));
}
