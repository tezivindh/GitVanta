import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Braces, Download } from 'lucide-react';
import { analysisApi } from '../../api/analysis';
import { reportError, downloadBlob } from '../../lib/errors';
import { toast } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { Button, PageHeader } from '../../components/ui';
import AnalysisGate from '../../components/AnalysisGate';
import { AnalysisReport } from '../../types';

const today = () => new Date().toISOString().slice(0, 10);

/** The export formats. `embedded` drops the page header for the Settings tab. */
const ExportContent: React.FC<{ analysis: AnalysisReport; embedded?: boolean }> = ({ analysis, embedded = false }) => {
  const username = useAuthStore((s) => s.user?.username ?? 'portfolio');
  const [busy, setBusy] = useState<'pdf' | 'json' | null>(null);

  const exportPdf = async () => {
    setBusy('pdf');
    try {
      const blob = await analysisApi.exportToPDF();
      downloadBlob(blob, `gitvanta-report-${username}-${today()}.pdf`);
      toast.success('PDF downloaded');
    } catch (e) {
      await reportError(e, 'PDF export failed');
    } finally {
      setBusy(null);
    }
  };

  const exportJson = () => {
    setBusy('json');
    try {
      const { _id, userId, ...report } = analysis as AnalysisReport & { _id: string; userId: string };
      void _id;
      void userId;
      const payload = { format: 'gitvanta-analysis-v1', exportedAt: new Date().toISOString(), username, ...report };
      downloadBlob(
        new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
        `gitvanta-analysis-${username}-${today()}.json`
      );
      toast.success('JSON downloaded');
    } finally {
      setBusy(null);
    }
  };

  const options = [
    {
      icon: FileText,
      title: 'PDF report',
      file: `gitvanta-report-${username}-${today()}.pdf`,
      text: 'A printable report with your score, category breakdown, skills, badges and the improvements to make. Good for applications and interviews.',
      action: (
        <Button type="button" onClick={exportPdf} isLoading={busy === 'pdf'} leftIcon={<Download className="h-4 w-4" />}>
          Download PDF
        </Button>
      ),
    },
    {
      icon: Braces,
      title: 'JSON data',
      file: `gitvanta-analysis-${username}-${today()}.json`,
      text: 'Your latest analysis exactly as GitVanta stores it: every score, metric, skill, badge, repository and suggestion. Good for your own tools or site.',
      action: (
        <Button
          type="button"
          variant="outline"
          onClick={exportJson}
          isLoading={busy === 'json'}
          leftIcon={<Download className="h-4 w-4" />}
        >
          Download JSON
        </Button>
      ),
    },
  ];

  const analysedOn = (
    <>
      Download your analysis from{' '}
      <span className="measured">
        {new Date(analysis.generatedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
      </span>
      .
    </>
  );

  return (
    <div className="space-y-6">
      {embedded ? <p className="text-sm text-muted">{analysedOn}</p> : <PageHeader title="Export" description={analysedOn} />}
      <ul className={embedded ? 'divide-y divide-rule border-y border-rule' : 'card divide-y divide-rule'} aria-label="Export formats">
        {options.map((o) => (
          <li
            key={o.title}
            className={
              embedded
                ? 'grid gap-4 py-5 min-[60rem]:grid-cols-[minmax(0,1fr)_auto] min-[60rem]:items-center min-[60rem]:gap-10'
                : 'grid gap-4 p-5 sm:p-6 min-[60rem]:grid-cols-[minmax(0,1fr)_auto] min-[60rem]:items-center min-[60rem]:gap-10'
            }
          >
            <div className="flex min-w-0 gap-4">
              <o.icon className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
              <div className="min-w-0">
                <h2 className="max-w-none text-md font-medium leading-snug tracking-[-0.01em] text-ink">{o.title}</h2>
                <p className="mt-1 max-w-[68ch] text-sm text-muted">{o.text}</p>
                <p className="measured mt-2 truncate text-xs text-ink-2">{o.file}</p>
              </div>
            </div>
            <div className="pl-9 min-[60rem]:pl-0">{o.action}</div>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted">
        Need everything, including your full analysis history and settings?{' '}
        <Link
          to="/dashboard/settings#account"
          className="text-ink underline decoration-rule-2 underline-offset-[0.16em] transition-colors duration-[120ms] ease-out hover:text-accent"
        >
          {embedded ? 'Export all your data from the Account tab' : 'Export all your data from Settings'}
        </Link>
        .
      </p>
    </div>
  );
};

/** The Export tab inside Settings. */
export const ExportSection: React.FC = () => (
  <AnalysisGate>{(a) => <ExportContent analysis={a} embedded />}</AnalysisGate>
);

const ExportPage: React.FC = () => (
  <AnalysisGate header={<PageHeader title="Export" />}>{(a) => <ExportContent analysis={a} />}</AnalysisGate>
);

export default ExportPage;
