import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, LogOut, Settings, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Logo, ThemeToggle } from '../ui';

interface HeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

const itemClass =
  'flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus-visible:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus-visible:bg-gray-800';

const Header: React.FC<HeaderProps> = ({ onMenuToggle, isMenuOpen }) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !buttonRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    menuRef.current?.querySelector<HTMLElement>('a,button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-gray-50/90 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/90">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <button
              type="button"
              onClick={onMenuToggle}
              aria-label={isMenuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={!!isMenuOpen}
              aria-controls="dashboard-sidebar"
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 lg:hidden dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
          <Logo to="/dashboard" />
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {isAuthenticated && user && (
            <div className="relative">
              <button
                ref={buttonRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`Account menu for ${user.displayName}`}
                className="flex items-center gap-2 rounded-full p-1 pr-1 hover:bg-gray-100 sm:pr-3 dark:hover:bg-gray-800"
              >
                <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full" />
                <span className="hidden max-w-[10rem] truncate text-sm font-medium text-gray-700 sm:block dark:text-gray-300">
                  {user.displayName}
                </span>
              </button>

              {open && (
                <div
                  ref={menuRef}
                  role="menu"
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="border-b border-gray-100 px-4 py-2 dark:border-gray-800">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{user.displayName}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">@{user.username}</p>
                  </div>
                  <Link role="menuitem" to="/dashboard" onClick={() => setOpen(false)} className={itemClass}>
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Dashboard
                  </Link>
                  <Link role="menuitem" to={`/profile/${user.username}`} onClick={() => setOpen(false)} className={itemClass}>
                    <ExternalLink className="h-4 w-4" aria-hidden="true" /> Your public profile
                  </Link>
                  <Link role="menuitem" to="/dashboard/settings" onClick={() => setOpen(false)} className={itemClass}>
                    <Settings className="h-4 w-4" aria-hidden="true" /> Settings
                  </Link>
                  <button
                    role="menuitem"
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50 focus-visible:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
