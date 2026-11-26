import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, LogOut, Settings, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Logo } from '../ui';

interface HeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

const itemClass =
  'flex h-9 w-full items-center gap-2.5 px-3 text-sm text-ink-2 transition-colors duration-[120ms] ease-out pointer-coarse:h-11 hover:bg-paper-3 hover:text-ink focus-visible:bg-paper-3 focus-visible:-outline-offset-2';

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
    <header className="fixed inset-x-0 top-0 z-40 border-b border-rule bg-paper pt-[env(safe-area-inset-top)]">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <button
              type="button"
              onClick={onMenuToggle}
              aria-label={isMenuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={!!isMenuOpen}
              aria-controls="dashboard-sidebar"
              className="inline-flex size-9 items-center justify-center rounded-pill text-muted transition-[background-color,color,transform] duration-[120ms] ease-out hover:bg-paper-2 hover:text-ink active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 pointer-coarse:size-11 lg:hidden"
            >
              {isMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          )}
          <Logo to="/dashboard" />
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {isAuthenticated && user && (
            <div className="relative">
              <button
                ref={buttonRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`Account menu for ${user.displayName}`}
                className="flex h-9 items-center gap-2 rounded-pill border border-transparent px-1 transition-[background-color,border-color] duration-[120ms] ease-out hover:border-rule hover:bg-paper-2 aria-expanded:border-rule aria-expanded:bg-paper-2 pointer-coarse:h-11 sm:pr-2.5"
              >
                <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full border border-rule" />
                <span className="hidden max-w-[10rem] truncate text-sm font-medium text-ink-2 sm:block">
                  {user.displayName}
                </span>
              </button>

              {open && (
                <div
                  ref={menuRef}
                  role="menu"
                  className="card absolute right-0 z-[100] mt-2 w-60 origin-top-right overflow-hidden py-1 transition-[opacity,translate] duration-[120ms] ease-out starting:-translate-y-1 starting:opacity-0"
                >
                  <div className="mb-1 border-b border-rule px-3 pb-2.5 pt-2">
                    <p className="truncate text-sm font-medium text-ink">{user.displayName}</p>
                    <p className="measured truncate text-xs text-muted">@{user.username}</p>
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
                    className="mt-1 flex h-9 w-full items-center gap-2.5 border-t border-rule px-3 text-sm text-bad transition-colors duration-[120ms] ease-out pointer-coarse:h-11 hover:bg-bad-soft focus-visible:bg-bad-soft focus-visible:-outline-offset-2"
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
