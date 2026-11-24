import React from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Github, ShieldCheck, EyeOff, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store';
import { Button, LogoMark, ThemeToggle } from '../components/ui';

const ERROR_MESSAGES: Record<string, string> = {
  session_expired: 'Your session ended. Sign in again to continue.',
  auth_failed: 'GitHub sign-in did not complete. Please try again.',
  no_code: 'GitHub did not return a sign-in code. Please try again.',
};

const POINTS = [
  {
    icon: ShieldCheck,
    title: 'Sign in through GitHub',
    text: 'Your GitHub password never reaches GitVanta.',
  },
  {
    icon: EyeOff,
    title: 'Private repos stay private',
    text: 'They count towards your score but are only listed publicly if you turn them on.',
  },
  {
    icon: Trash2,
    title: 'Leave any time',
    text: 'Export or delete all of your data from Settings.',
  },
];

const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [params] = useSearchParams();
  const errorKey = params.get('error');
  const errorMessage = errorKey ? ERROR_MESSAGES[errorKey] ?? ERROR_MESSAGES.auth_failed : null;

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
    <div className="dark flex min-h-dvh flex-col bg-gray-950 pt-[env(safe-area-inset-top)] text-gray-100">
      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex rounded-lg" aria-label="GitVanta home">
              <LogoMark className="h-12 w-12" />
            </Link>
            <h1 className="font-display mt-5 text-[2rem] leading-tight text-gray-950 dark:text-white">Sign in to GitVanta</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Score your GitHub portfolio and see what to improve.</p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            >
              {errorMessage}
            </div>
          )}

          <div className="card p-6 sm:p-8">
            <Button
              onClick={handleGitHubLogin}
              variant="primary"
              size="lg"
              fullWidth
              leftIcon={<Github className="h-5 w-5" />}
              loading={isLoading}
            >
              Continue with GitHub
            </Button>

            <ul className="mt-6 space-y-4">
              {POINTS.map((p) => (
                <li key={p.title} className="flex items-start gap-3">
                  <p.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{p.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{p.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            GitHub will ask for access to your repositories. GitVanta only reads them.{' '}
            <Link to="/#faq" className="font-medium text-primary-700 underline-offset-2 hover:underline dark:text-primary-400">
              Why this access?
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
