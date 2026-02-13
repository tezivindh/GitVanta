// =====================================================
// ENHANCEMENTS PAGE - AI-powered improvements
// =====================================================

import React, { useState } from 'react';
import { Sparkles, FileText, Lightbulb, Map, Copy, Check, FileStack } from 'lucide-react';
import { useAnalysisStore } from '../../store/analysisStore';
import { enhancementApi } from '../../api/enhancement';
import { Card, CardHeader, Button, Alert, Textarea, Loader } from '../../components/ui';

type EnhancementType = 'readme' | 'resume' | 'summary' | 'roadmap';

const EnhancementsPage: React.FC = () => {
  const { currentReport } = useAnalysisStore();
  const [selectedType, setSelectedType] = useState<EnhancementType>('readme');
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [content, setContent] = useState('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const repositories = currentReport?.result.repositories || [];
  const weaknesses = currentReport?.result.weaknesses || [];

  const enhancementOptions = [
    {
      type: 'readme' as const,
      icon: FileText,
      title: 'Enhance README',
      description: 'Improve your repository README with AI suggestions',
    },
    {
      type: 'resume' as const,
      icon: FileStack,
      title: 'Resume Bullets',
      description: 'Generate resume-ready bullet points from your projects',
    },
    {
      type: 'summary' as const,
      icon: Lightbulb,
      title: 'Portfolio Summary',
      description: 'Create a compelling developer portfolio summary',
    },
    {
      type: 'roadmap' as const,
      icon: Map,
      title: 'Improvement Roadmap',
      description: 'Get personalized recommendations to improve your portfolio',
    },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult('');

    try {
      let resultContent = '';

      switch (selectedType) {
        case 'readme':
          if (!selectedRepo) {
            throw new Error('Please select a repository');
          }
          const readmeResponse = await enhancementApi.enhanceReadme(selectedRepo);
          resultContent = readmeResponse.enhancedContent;
          break;
        case 'resume':
          if (!selectedRepo) {
            throw new Error('Please select a repository');
          }
          const resumeResponse = await enhancementApi.generateResumeBullets(selectedRepo);
          resultContent = resumeResponse.bullets.join('\n\n');
          break;
        case 'summary':
          const summaryResponse = await enhancementApi.generatePortfolioSummary();
          resultContent = `${summaryResponse.headline}\n\n${summaryResponse.summary}`;
          break;
        case 'roadmap':
          const roadmapResponse = await enhancementApi.generateImprovementRoadmap();
          resultContent = formatRoadmap(roadmapResponse);
          break;
      }

      setResult(resultContent);
    } catch (err: any) {
      setError(err.message || 'Failed to generate enhancement');
    } finally {
      setLoading(false);
    }
  };

  const formatRoadmap = (roadmap: { shortTerm: any[]; mediumTerm: any[]; longTerm: any[] }) => {
    const format = (items: any[], label: string) => 
      items.length > 0 ? `## ${label}\n${items.map(i => `- ${i.title}: ${i.description}`).join('\n')}` : '';
    return [
      format(roadmap.shortTerm, 'Short Term'),
      format(roadmap.mediumTerm, 'Medium Term'),
      format(roadmap.longTerm, 'Long Term'),
    ].filter(Boolean).join('\n\n');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!currentReport) {
    return (
      <Alert variant="info" title="No Analysis Found">
        Run an analysis from the dashboard to use AI enhancements.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Enhancements</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Use AI to generate improvements and content for your portfolio
        </p>
      </div>

      {/* Enhancement Type Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {enhancementOptions.map((option) => (
          <button
            key={option.type}
            onClick={() => {
              setSelectedType(option.type);
              setResult('');
              setError(null);
            }}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              selectedType === option.type
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <option.icon
              className={`w-6 h-6 mb-2 ${
                selectedType === option.type ? 'text-primary-600' : 'text-gray-400 dark:text-gray-500'
              }`}
            />
            <h3 className="font-semibold text-gray-900 dark:text-white">{option.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{option.description}</p>
          </button>
        ))}
      </div>

      {/* Enhancement Configuration */}
      <Card>
        <CardHeader
          title={enhancementOptions.find((o) => o.type === selectedType)?.title || ''}
          icon={<Sparkles className="w-5 h-5 text-primary-600" />}
        />

        {selectedType === 'readme' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Repository
              </label>
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
              >
                <option value="">Choose a repository</option>
                {repositories.map((repo) => (
                  <option key={repo.name} value={repo.name}>
                    {repo.name}
                  </option>
                ))}
              </select>
            </div>

            <Textarea
              label="Current README Content (optional)"
              placeholder="Paste your current README content here for AI enhancement..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
            />
          </div>
        )}

        {selectedType === 'resume' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Repository
              </label>
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
              >
                <option value="">Choose a repository</option>
                {repositories.map((repo) => (
                  <option key={repo.name} value={repo.name}>
                    {repo.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Generate professional resume bullet points for the selected repository.
            </p>
          </div>
        )}

        {selectedType === 'summary' && (
          <p className="text-gray-600 dark:text-gray-400">
            Create a compelling portfolio summary highlighting your skills, experience,
            and achievements.
          </p>
        )}

        {selectedType === 'roadmap' && (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Get personalized recommendations based on your current skills and identified
              areas for improvement.
            </p>
            {weaknesses.length > 0 && (
              <Alert variant="info" title="Areas to Improve">
                <ul className="list-disc list-inside mt-2">
                  {weaknesses.slice(0, 3).map((weakness: string, index: number) => (
                    <li key={index}>{weakness}</li>
                  ))}
                </ul>
              </Alert>
            )}
          </div>
        )}

        <div className="mt-6">
          <Button
            onClick={handleGenerate}
            loading={loading}
            disabled={selectedType === 'readme' && !selectedRepo}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Generate with AI
          </Button>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="error" title="Generation Failed">
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Card className="py-12">
          <div className="flex flex-col items-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Generating with AI...</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">This may take a moment</p>
          </div>
        </Card>
      )}

      {/* Result */}
      {result && !loading && (
        <Card>
          <CardHeader
            title="Generated Content"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            }
          />
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono">
              {result}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
};

export default EnhancementsPage;
