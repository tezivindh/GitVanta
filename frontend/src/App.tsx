// =====================================================
// APP COMPONENT - Main application with routing
// =====================================================

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import {
  LandingPage,
  LoginPage,
  AuthCallbackPage,
  PublicProfilePage,
  DashboardOverview,
  RepositoriesPage,
  SkillsPage,
  EnhancementsPage,
  BadgesPage,
  AnalyticsPage,
  ComparePage,
  RecruiterPage,
  ExportPage,
  SettingsPage,
} from './pages';

const App: React.FC = () => {
  const { token, user, fetchUser } = useAuthStore();

  // Initialize theme on mount
  useThemeStore();

  // Fetch user on app load if token exists but user is null
  useEffect(() => {
    if (token && !user) {
      fetchUser();
    }
  }, [token, user, fetchUser]);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/profile/:username" element={<PublicProfilePage />} />

        {/* Protected dashboard routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="repositories" element={<RepositoriesPage />} />
          <Route path="skills" element={<SkillsPage />} />
          <Route path="enhancements" element={<EnhancementsPage />} />
          <Route path="badges" element={<BadgesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="recruiter" element={<RecruiterPage />} />
          <Route path="export" element={<ExportPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
