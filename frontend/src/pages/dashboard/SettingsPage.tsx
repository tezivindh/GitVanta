// =====================================================
// SETTINGS PAGE - User preferences
// =====================================================

import React from 'react';
import { Settings, Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

const SettingsPage: React.FC = () => {
  const { darkMode, toggleDarkMode } = useThemeStore();

  return (
    <div className="space-y-8 animate-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Settings className="w-7 h-7 text-primary-600" />
          Settings
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Manage your GitVanta preferences
        </p>
      </div>

      {/* Appearance Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Appearance
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Customize how GitVanta looks
          </p>
        </div>

        <div className="px-6 py-5">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {darkMode ? (
                  <Moon className="w-5 h-5 text-indigo-500" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Dark Mode
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {darkMode
                    ? 'Dark theme is active — easier on the eyes at night'
                    : 'Light theme is active — switch to dark for a sleek look'}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                darkMode ? 'bg-primary-600' : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={darkMode}
              aria-label="Toggle dark mode"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* More settings sections can be added here later */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            More Settings
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Additional preferences coming soon
          </p>
        </div>

        <div className="px-6 py-8 text-center">
          <Monitor className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Notification preferences, data export options, and account management will be available here soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
