import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard,
  FolderGit2,
  Sparkles,
  Brain,
  Users,
  FileDown,
  Trophy,
  BarChart3,
  GitCompare,
  X,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { name: 'Repositories', href: '/dashboard/repositories', icon: FolderGit2 },
  { name: 'Skills', href: '/dashboard/skills', icon: Brain },
  { name: 'Enhancements', href: '/dashboard/enhancements', icon: Sparkles },
  { name: 'Badges', href: '/dashboard/badges', icon: Trophy },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Compare', href: '/dashboard/compare', icon: GitCompare },
  { name: 'Professional View', href: '/dashboard/professional-profile', icon: Users },
  { name: 'Export', href: '/dashboard/export', icon: FileDown },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 animate-fade-in bg-gray-950/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="dashboard-sidebar"
        aria-label="Dashboard"
        className={clsx(
          'dark fixed top-16 left-0 h-[calc(100dvh-4rem)] w-64 bg-gray-950 border-r border-gray-800',
          'transform transition-transform duration-300 ease-[var(--ease-drawer)] z-50',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full invisible lg:visible'
        )}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-gray-200 dark:border-gray-800">
          <span className="font-semibold text-gray-900 dark:text-white">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav aria-label="Dashboard sections" className="h-full space-y-1 overflow-y-auto overscroll-contain p-4 pb-[calc(6rem+env(safe-area-inset-bottom))]">
          {navigation.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-[15px] transition-colors pointer-coarse:py-3',
                  active
                    ? 'bg-paper font-semibold text-gray-950 shadow-[inset_3px_0_0_var(--color-primary-400)] dark:bg-gray-900 dark:text-white'
                    : 'font-medium text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-900'
                )}
              >
                <item.icon
                  aria-hidden="true"
                  className={clsx(
                    'h-[18px] w-[18px]',
                    active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-500'
                  )}
                />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
