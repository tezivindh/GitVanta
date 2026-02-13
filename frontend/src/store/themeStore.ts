// =====================================================
// THEME STORE - Dark mode persistence
// =====================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (enabled: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      darkMode: false,

      toggleDarkMode: () => {
        set((state) => {
          const next = !state.darkMode;
          applyDarkClass(next);
          return { darkMode: next };
        });
      },

      setDarkMode: (enabled: boolean) => {
        applyDarkClass(enabled);
        set({ darkMode: enabled });
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        // Apply dark class on rehydration (page load)
        if (state) {
          applyDarkClass(state.darkMode);
        }
      },
    }
  )
);

function applyDarkClass(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
