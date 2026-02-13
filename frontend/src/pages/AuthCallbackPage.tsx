// =====================================================
// AUTH CALLBACK PAGE - Handle OAuth redirect
// =====================================================

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FullPageLoader } from '../components/ui/Loader';
import { Alert } from '../components/ui';

const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth, logout } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(errorParam);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (token) {
        try {
          // Store the token
          localStorage.setItem('token', token);

          // Fetch user profile
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/me`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error('Failed to fetch user profile');
          }

          const data = await response.json();

          // Set auth state
          setAuth(token, data.data.user);

          // Redirect to dashboard
          navigate('/dashboard', { replace: true });
        } catch (err) {
          console.error('Auth callback error:', err);
          setError('Failed to complete authentication');
          logout();
          setTimeout(() => navigate('/login'), 3000);
        }
      } else {
        setError('No authentication token received');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, setAuth, navigate, logout]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="error" title="Authentication Failed">
            {error}
            <p className="mt-2 text-sm">Redirecting to login page...</p>
          </Alert>
        </div>
      </div>
    );
  }

  return <FullPageLoader text="Completing authentication..." />;
};

export default AuthCallbackPage;
