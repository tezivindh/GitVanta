import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  /** Resolved theme currently on screen. */
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const media = () =>
  typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function resolve(mode: ThemeMode): boolean {
  return mode === 'dark' || (mode === 'system' && !!media()?.matches);
}

function apply(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
  // Keep the status bar / browser chrome on the theme the page is actually in.
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
    m.content = dark ? '#0a1416' : '#f3f5f4';
  });
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      isDark: resolve('system'),
      setMode: (mode) => {
        const isDark = resolve(mode);
        apply(isDark);
        set({ mode, isDark });
      },
      toggle: () => get().setMode(get().isDark ? 'light' : 'dark'),
    }),
    {
      name: 'theme-storage',
      version: 2,
      partialize: (s) => ({ mode: s.mode }),
      // v1 stored { darkMode: boolean }
      migrate: (persisted: any) => {
        if (persisted && typeof persisted.darkMode === 'boolean') {
          return { mode: persisted.darkMode ? 'dark' : 'light' } as any;
        }
        return persisted;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const isDark = resolve(state.mode);
        apply(isDark);
        useThemeStore.setState({ isDark });
      },
    }
  )
);

// Follow the OS setting live when the user chose "system".
media()?.addEventListener('change', () => {
  const { mode } = useThemeStore.getState();
  if (mode === 'system') useThemeStore.getState().setMode('system');
});
