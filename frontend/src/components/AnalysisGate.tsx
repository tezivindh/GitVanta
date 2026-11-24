import React, { useEffect } from 'react';
import { BarChart3, Play } from 'lucide-react';
import { useAnalysisStore } from '../store/analysisStore';
import { AnalysisReport } from '../types';
import { Button, EmptyState, ErrorState, PageSkeleton } from './ui';
import { toast } from '../store/toastStore';

/** Run a new analysis with toasts for the outcome. Shared by every page. */
export async function runAnalysisWithFeedback(): Promise<void> {
  const store = useAnalysisStore.getState();
  const previous = store.analysis?.overallScore;
  await store.runAnalysis();
  const { analysis, error } = useAnalysisStore.getState();
  if (error) {
    toast.error('Analysis failed', error);
    return;
  }
  if (analysis) {
    const change = previous !== undefined ? analysis.overallScore - previous : null;
    toast.success(
      'Analysis complete',
      change === null || change === 0
        ? `Your score is ${analysis.overallScore}.`
        : `Your score is ${analysis.overallScore} (${change > 0 ? '+' : ''}${change} since last time).`
    );
  }
}

interface AnalysisGateProps {
  /** Rendered once an analysis exists. */
  children: (analysis: AnalysisReport) => React.ReactNode;
  /** Shown above the empty state, e.g. the page header. */
  header?: React.ReactNode;
  emptyDescription?: string;
}

/**
 * Loads the latest analysis (once, from any page) and handles the loading,
 * error and "no analysis yet" states so pages only render the happy path.
 */
const AnalysisGate: React.FC<AnalysisGateProps> = ({ children, header, emptyDescription }) => {
  const { analysis, hasFetched, isLoadingAnalysis, isAnalyzing, error, ensureLatest, fetchLatestReport } =
    useAnalysisStore();

  useEffect(() => {
    ensureLatest();
  }, [ensureLatest]);

  if (analysis) return <>{children(analysis)}</>;

  if (!hasFetched || isLoadingAnalysis) return <PageSkeleton />;

  if (error && !isAnalyzing) {
    return (
      <>
        {header}
        <ErrorState message={error} onRetry={() => fetchLatestReport()} retrying={isLoadingAnalysis} />
      </>
    );
  }

  return (
    <>
      {header}
      <EmptyState
        icon={BarChart3}
        title={isAnalyzing ? 'Analysing your repositories…' : 'No analysis yet'}
        description={
          isAnalyzing
            ? 'This usually takes under a minute. You can keep this page open.'
            : emptyDescription ?? 'Run your first analysis to see your score, skills, badges and suggested fixes.'
        }
        action={
          <Button leftIcon={<Play className="h-4 w-4" />} isLoading={isAnalyzing} onClick={runAnalysisWithFeedback}>
            Run analysis
          </Button>
        }
      />
    </>
  );
};

export default AnalysisGate;
