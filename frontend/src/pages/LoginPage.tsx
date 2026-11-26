import React from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Github, ShieldCheck, EyeOff, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store';
import { Button, LogoMark } from '../components/ui';

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
    <div className="relative min-h-dvh bg-paper pt-[env(safe-area-inset-top)] text-ink">
      {/* Corridor: one centred column, the head carries the page. */}
      <main className="flex min-h-dvh items-center justify-center px-4 py-20">
        <div className="w-full max-w-[44ch]">
          <Link to="/" className="inline-flex rounded-pill focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus" aria-label="GitVanta home">
            <LogoMark className="h-10 w-10" />
          </Link>
          <h1 className="mt-8 max-w-none font-display text-display-s font-medium leading-[1.02] tracking-[-0.03em] text-ink">
            Sign in to GitVanta
          </h1>
          <p className="mt-4 text-lead leading-[1.45] text-ink-2">Score your GitHub portfolio and see what to improve.</p>

          {errorMessage && (
            <div
              role="alert"
              className="mt-8 rounded-pill border border-bad bg-bad-soft px-4 py-3 text-sm text-ink"
            >
              {errorMessage}
            </div>
          )}

          <Button
            onClick={handleGitHubLogin}
            variant="primary"
            size="lg"
            fullWidth
            leftIcon={<Github className="h-5 w-5" />}
            loading={isLoading}
            className="mt-8 h-12"
          >
            Continue with GitHub
          </Button>

          <ul className="mt-10 border-b border-rule">
            {POINTS.map((p) => (
              <li key={p.title} className="flex items-start gap-3 border-t border-rule py-4">
                <p.icon className="mt-[3px] h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{p.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-sm text-muted">
            GitHub will ask for access to your repositories. GitVanta only reads them.{' '}
            <Link
              to="/#faq"
              className="text-ink-2 underline decoration-rule-2 underline-offset-4 transition-[color,text-decoration-color] duration-[120ms] ease-out hover:text-accent hover:decoration-accent"
            >
              Why this access?
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
