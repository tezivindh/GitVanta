import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { LogoMark } from '../components/ui';

const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth, logout } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  // The spinner waits a beat so a fast sign-in never flashes it.
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowSpinner(true), 200);
    return () => clearTimeout(t);
  }, []);

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

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4 py-16 text-ink">
      <div className="w-full max-w-[44ch]">
        <LogoMark className="h-9 w-9" />
        {error ? (
          <div role="alert" className="mt-8">
            <h1 className="max-w-none font-display text-2xl font-medium tracking-[-0.02em] text-ink">
              Sign-in did not complete
            </h1>
            <p className="mt-4 rounded-pill border border-bad bg-bad-soft px-4 py-3 text-sm text-ink">{error}</p>
            <p className="mt-4 text-sm text-muted">
              Taking you back to the sign-in page…{' '}
              <Link
                to="/login"
                className="text-ink-2 underline decoration-rule-2 underline-offset-4 transition-[color,text-decoration-color] duration-[120ms] ease-out hover:text-accent hover:decoration-accent"
              >
                Go now
              </Link>
            </p>
          </div>
        ) : (
          <div role="status" aria-live="polite" className="mt-8 flex min-h-6 items-center gap-3">
            {showSpinner && (
              <>
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-cool motion-reduce:animate-none" aria-hidden="true" />
                <p className="text-md text-ink-2">Completing authentication…</p>
              </>
            )}
            {!showSpinner && <span className="sr-only">Completing authentication…</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallbackPage;
