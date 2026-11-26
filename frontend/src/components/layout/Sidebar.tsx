import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import {
  LayoutDashboard,
  FolderGit2,
  Sparkles,
  Brain,
  Users,
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
  { name: 'Professional view', href: '/dashboard/professional-profile', icon: Users },
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
          className="fixed inset-0 z-40 animate-fade-in bg-scrim motion-reduce:animate-none lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="dashboard-sidebar"
        aria-label="Dashboard"
        className={clsx(
          'fixed left-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-50 h-[calc(100dvh-3.5rem-env(safe-area-inset-top))] w-64 border-r border-rule bg-paper-2 lg:w-60',
          'transition-transform duration-[220ms] ease-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full invisible lg:visible'
        )}
      >
        {/* Mobile close button */}
        <div className="flex h-14 items-center justify-between border-b border-rule px-4 lg:hidden">
          <span className="text-sm font-medium text-ink">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="inline-flex size-9 items-center justify-center rounded-pill text-muted transition-colors duration-[120ms] ease-out hover:bg-paper-3 hover:text-ink pointer-coarse:size-11"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation */}
        <nav aria-label="Dashboard sections" className="h-full space-y-px overflow-y-auto overscroll-contain px-3 py-4 pb-[calc(6rem+env(safe-area-inset-bottom))]">
          {navigation.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'relative flex h-9 items-center gap-3 rounded-pill px-3 text-sm transition-colors duration-[120ms] ease-out pointer-coarse:h-11',
                  'before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:content-[""]',
                  active
                    ? 'bg-paper-3 font-medium text-ink before:bg-accent'
                    : 'text-muted hover:bg-paper-3 hover:text-ink before:bg-transparent'
                )}
              >
                <item.icon
                  aria-hidden="true"
                  className={clsx(
                    'h-4 w-4 shrink-0',
                    active ? 'text-accent' : 'text-muted'
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
