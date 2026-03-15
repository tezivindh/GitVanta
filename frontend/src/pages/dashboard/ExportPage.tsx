import React, { useState } from 'react';
import { FileDown, Download, FileText, Settings } from 'lucide-react';
import { useAnalysisStore } from '../../store/analysisStore';
import { analysisApi } from '../../api/analysis';
import { Card, CardHeader, Button, Alert } from '../../components/ui';

type ExportFormat = 'pdf' | 'json';

interface ExportOption {
  id: string;
  label: string;
  description: string;
  checked: boolean;
}

const ExportPage: React.FC = () => {
  const { currentReport } = useAnalysisStore();
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [options, setOptions] = useState<ExportOption[]>([
    { id: 'overview', label: 'Score Overview', description: 'Overall score and grade', checked: true },
    { id: 'categories', label: 'Category Breakdown', description: 'Detailed category scores', checked: true },
    { id: 'skills', label: 'Skills', description: 'Detected technical skills', checked: true },
    { id: 'repositories', label: 'Repositories', description: 'Repository analysis', checked: true },
    { id: 'badges', label: 'Badges', description: 'Earned achievements', checked: true },
    { id: 'improvements', label: 'Improvements', description: 'Suggested improvements', checked: true },
  ]);

  const toggleOption = (id: string) => {
    setOptions(
      options.map((opt) =>
        opt.id === id ? { ...opt, checked: !opt.checked } : opt
      )
    );
  };

  const handleExport = async () => {
    if (!currentReport) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (format === 'pdf') {
        const blob = await analysisApi.exportToPDF();
        
        // Create blob and download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `portfolio-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // JSON export
        const exportData = {
          exportedAt: new Date().toISOString(),
          ...currentReport.result,
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `portfolio-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  if (!currentReport) {
    return (
      <Alert variant="info" title="No Analysis Found">
        Run an analysis from the dashboard to export your report.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Export Report</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Download your portfolio analysis as a PDF or JSON file
        </p>
      </div>

      {/* Format Selection */}
      <Card>
        <CardHeader
          title="Export Format"
          icon={<FileDown className="w-5 h-5 text-primary-600" />}
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => setFormat('pdf')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              format === 'pdf'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <FileText
              className={`w-8 h-8 mb-2 ${
                format === 'pdf' ? 'text-primary-600' : 'text-gray-400'
              }`}
            />
            <h3 className="font-semibold text-gray-900 dark:text-white">PDF Report</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Professional PDF document ready for sharing
            </p>
          </button>

          <button
            onClick={() => setFormat('json')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              format === 'json'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <Settings
              className={`w-8 h-8 mb-2 ${
                format === 'json' ? 'text-primary-600' : 'text-gray-400'
              }`}
            />
            <h3 className="font-semibold text-gray-900 dark:text-white">JSON Data</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Raw data for integration or analysis
            </p>
          </button>
        </div>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader title="Include in Export" />
        <div className="space-y-3">
          {options.map((option) => (
            <label
              key={option.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={option.checked}
                onChange={() => toggleOption(option.id)}
                className="mt-1 w-4 h-4 rounded-sm border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </Card>

      {/* Export Preview */}
      <Card>
        <CardHeader title="Export Preview" />
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Portfolio Analysis Report
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Score: {currentReport.result.score.overall}/100 •{' '}
            {currentReport.result.repositories.length} repositories •{' '}
            {currentReport.result.skills.length} skills
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Generated{' '}
            {new Date(currentReport.createdAt).toLocaleDateString('en-US', {
              dateStyle: 'long',
            })}
          </p>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="error" title="Export Failed">
          {error}
        </Alert>
      )}

      {/* Success */}
      {success && (
        <Alert variant="success" title="Export Complete">
          Your report has been downloaded successfully.
        </Alert>
      )}

      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleExport}
          loading={loading}
          leftIcon={loading ? undefined : <Download className="w-5 h-5" />}
        >
          {loading
            ? 'Generating...'
            : `Export as ${format.toUpperCase()}`}
        </Button>
      </div>
    </div>
  );
};

export default ExportPage;
