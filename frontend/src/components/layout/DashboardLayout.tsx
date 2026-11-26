import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Header from './Header';
import Sidebar from './Sidebar';
import { FullPageLoader } from '../ui/Loader';

const DashboardLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return <FullPageLoader text="Loading your portfolio…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-dvh bg-paper pt-[calc(3.5rem+env(safe-area-inset-top))] text-ink">
      <a
        href="#dashboard-main"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[60] focus-visible:rounded-pill focus-visible:border focus-visible:border-rule-2 focus-visible:bg-paper-2 focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:text-ink"
      >
        Skip to content
      </a>
      <Header
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isMenuOpen={sidebarOpen}
      />

      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content */}
        <main id="dashboard-main" className="min-h-[calc(100dvh-3.5rem)] min-w-0 flex-1 px-4 py-6 sm:px-6 lg:ml-60 lg:px-10 lg:py-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
