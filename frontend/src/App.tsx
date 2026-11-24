import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from './components/layout';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { Toaster, PageSkeleton } from './components/ui';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';

// Everything behind sign-in (and the chart library) loads on demand, so the
// landing page stays small.
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const DashboardOverview = lazy(() => import('./pages/dashboard/DashboardOverview'));
const RepositoriesPage = lazy(() => import('./pages/dashboard/RepositoriesPage'));
const SkillsPage = lazy(() => import('./pages/dashboard/SkillsPage'));
const EnhancementsPage = lazy(() => import('./pages/dashboard/EnhancementsPage'));
const BadgesPage = lazy(() => import('./pages/dashboard/BadgesPage'));
const AnalyticsPage = lazy(() => import('./pages/dashboard/AnalyticsPage'));
const ComparePage = lazy(() => import('./pages/dashboard/ComparePage'));
const ProfessionalProfilePage = lazy(() => import('./pages/dashboard/ProfessionalProfilePage'));
const ExportPage = lazy(() => import('./pages/dashboard/ExportPage'));
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage'));

/** Scroll to top on navigation, or to #anchor when there is one. */
const ScrollManager: React.FC = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ block: 'start' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
};

const PageFallback: React.FC = () => (
  <div className="mx-auto max-w-6xl p-4 lg:p-8">
    <PageSkeleton />
  </div>
);

const App: React.FC = () => {
  const { token, user, fetchUser } = useAuthStore();

  // Subscribe so the theme class stays in sync with the stored preference.
  useThemeStore();

  // Fetch user on app load if token exists but user is null
  useEffect(() => {
    if (token && !user) {
      fetchUser();
    }
  }, [token, user, fetchUser]);

  const page = (el: React.ReactNode) => (
    <ErrorBoundary>
      <Suspense fallback={<PageFallback />}>{el}</Suspense>
    </ErrorBoundary>
  );

  return (
    <Router>
      <ScrollManager />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/profile/:username" element={page(<PublicProfilePage />)} />

        {/* Protected dashboard routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={page(<DashboardOverview />)} />
          <Route path="repositories" element={page(<RepositoriesPage />)} />
          <Route path="skills" element={page(<SkillsPage />)} />
          <Route path="enhancements" element={page(<EnhancementsPage />)} />
          <Route path="badges" element={page(<BadgesPage />)} />
          <Route path="analytics" element={page(<AnalyticsPage />)} />
          <Route path="compare" element={page(<ComparePage />)} />
          <Route path="professional-profile" element={page(<ProfessionalProfilePage />)} />
          <Route path="export" element={page(<ExportPage />)} />
          <Route path="settings" element={page(<SettingsPage />)} />
        </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </Router>
  );
};

export default App;
