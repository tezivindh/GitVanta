import React from 'react';
import { ErrorState } from './ui/States';

interface State {
  error: Error | null;
}

/**
 * Catches render errors in a page so one broken view doesn't blank the app.
 * Also recovers from a stale deploy, where a lazy chunk no longer exists.
 */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // A new deploy removed the old chunk files: reload once to get them.
    if (/Failed to fetch dynamically imported module|Loading chunk/i.test(error.message)) {
      const key = 'gv-chunk-reload';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
      }
    }
    console.error(error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-xl p-6">
          <ErrorState
            title="This page hit a problem"
            message="Reload to try again. If it keeps happening, sign out and back in."
            onRetry={() => window.location.reload()}
          />
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
