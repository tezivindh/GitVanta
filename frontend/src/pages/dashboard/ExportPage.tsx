import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Braces, Download } from 'lucide-react';
import { analysisApi } from '../../api/analysis';
import { reportError, downloadBlob } from '../../lib/errors';
import { toast } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { Button, Card, PageHeader } from '../../components/ui';
import AnalysisGate from '../../components/AnalysisGate';
import { AnalysisReport } from '../../types';

const today = () => new Date().toISOString().slice(0, 10);

const ExportContent: React.FC<{ analysis: AnalysisReport }> = ({ analysis }) => {
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
      text: 'A printable report with your score, category breakdown, skills, badges and the improvements to make. Good for applications and interviews.',
      action: (
        <Button onClick={exportPdf} isLoading={busy === 'pdf'} leftIcon={<Download className="h-4 w-4" />}>
          Download PDF
        </Button>
      ),
    },
    {
      icon: Braces,
      title: 'JSON data',
      text: 'Your latest analysis exactly as GitVanta stores it: every score, metric, skill, badge, repository and suggestion. Good for your own tools or site.',
      action: (
        <Button variant="outline" onClick={exportJson} isLoading={busy === 'json'} leftIcon={<Download className="h-4 w-4" />}>
          Download JSON
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Export"
        description={`Download your analysis from ${new Date(analysis.generatedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}.`}
      />
      <div className="grid gap-6 md:grid-cols-2">
        {options.map((o) => (
          <Card key={o.title} className="flex flex-col">
            <o.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">{o.title}</h2>
            <p className="mt-1 flex-1 text-sm text-gray-600 dark:text-gray-400">{o.text}</p>
            <div className="mt-5">{o.action}</div>
          </Card>
        ))}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Need everything, including your full analysis history and settings?{' '}
        <Link to="/dashboard/settings#account" className="font-medium text-primary-700 hover:underline dark:text-primary-400">
          Export all your data from Settings
        </Link>
        .
      </p>
    </div>
  );
};

const ExportPage: React.FC = () => (
  <AnalysisGate header={<PageHeader title="Export" />}>{(a) => <ExportContent analysis={a} />}</AnalysisGate>
);

export default ExportPage;
