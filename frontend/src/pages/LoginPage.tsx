// =====================================================
// LOGIN PAGE - GitHub OAuth login
// =====================================================

import React from 'react';
import { Navigate } from 'react-router-dom';
import { Github, Shield, Zap, Lock } from 'lucide-react';
import { useAuthStore } from '../store';
import { Button, Card } from '../components/ui';

const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Redirect if already logged in
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGitHubLogin = () => {
    // Redirect to backend OAuth endpoint
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    window.location.href = `${backendUrl}/auth/github`;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Github className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Portfolio Analyzer</h1>
          <p className="text-gray-600 mt-2">Sign in to analyze your GitHub portfolio</p>
        </div>

        {/* Login Card */}
        <Card className="p-8">
          <Button
            onClick={handleGitHubLogin}
            variant="primary"
            size="lg"
            fullWidth
            leftIcon={<Github className="w-5 h-5" />}
            loading={isLoading}
          >
            Continue with GitHub
          </Button>

          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Secure Authentication</h3>
                <p className="text-sm text-gray-500">
                  We use GitHub OAuth - your credentials never touch our servers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Read-Only Access</h3>
                <p className="text-sm text-gray-500">
                  We only read your public repository data. No write access required.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Instant Analysis</h3>
                <p className="text-sm text-gray-500">
                  Get your comprehensive portfolio score in minutes.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
