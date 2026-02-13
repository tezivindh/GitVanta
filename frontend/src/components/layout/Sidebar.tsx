// =====================================================
// SIDEBAR COMPONENT - Dashboard navigation
// =====================================================

import React from 'react';
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
  { name: 'Professional View', href: '/dashboard/recruiter', icon: Users },
  { name: 'Export', href: '/dashboard/export', icon: FileDown },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200',
          'transform transition-transform duration-200 ease-in-out z-50',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 lg:hidden border-b">
          <span className="font-semibold text-gray-900">Menu</span>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-full">
          {navigation.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                <item.icon
                  className={clsx(
                    'w-5 h-5',
                    active ? 'text-primary-600' : 'text-gray-400'
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
