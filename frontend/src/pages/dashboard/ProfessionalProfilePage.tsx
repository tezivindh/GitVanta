import React, { useState, useEffect } from 'react';
import { Copy, Check, ExternalLink, RefreshCw, Code, Star, GitFork, Folder } from 'lucide-react';
import { useAnalysisStore } from '../../store/analysisStore';
import { useAuthStore } from '../../store/authStore';
import { analysisApi } from '../../api/analysis';
import { Card, CardHeader, Button, Alert, ScoreCircle, Loader } from '../../components/ui';
import { ProfessionalProfile } from '../../types';

const ProfessionalProfilePage: React.FC = () => {
  const { currentReport } = useAnalysisStore();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchProfessionalProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await analysisApi.getProfessionalProfile();
      setProfile(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate professional profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessionalProfile();
  }, []);

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/profile/${user?.username}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!currentReport) {
    return (
      <Alert variant="info" title="No Analysis Found">
        Run an analysis from the dashboard first to generate your professional profile.
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Generating professional profile...</p>
      </div>
    );
  }

  // Show error but continue rendering the page with available data
  const { result } = currentReport;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Professional Portfolio View</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            A polished, shareable profile showcasing your GitHub portfolio to recruiters and hiring managers
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCopyLink}
            leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
          <Button
            variant="outline"
            onClick={fetchProfessionalProfile}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert - shown but doesn't block content */}
      {error && (
        <Alert variant="warning" title="AI Summary Unavailable">
          {error}. Your repositories, skills, and projects are still displayed below.
        </Alert>
      )}

      {/* Why Professional View Info */}
      <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
        <h3 className="font-semibold text-primary-800 dark:text-primary-300 mb-2">Why a Professional Portfolio View?</h3>
        <p className="text-primary-700 dark:text-primary-400 text-sm">
          This view presents your GitHub portfolio in a clean, professional format optimized for sharing with recruiters, 
          hiring managers, and potential collaborators. It highlights your best work, technical skills, and coding activity 
          in a single shareable link - no LinkedIn or resume required.
        </p>
      </div>

      {/* Preview Card */}
      <div className="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Profile */}
          <div className="flex items-start gap-4">
            <img
              src={user?.avatarUrl || '/placeholder.png'}
              alt={user?.displayName}
              className="w-20 h-20 rounded-full border-4 border-white/20"
            />
            <div>
              <h2 className="text-2xl font-bold">{user?.displayName}</h2>
              <p className="text-gray-300">@{user?.username}</p>
              {profile?.headline && (
                <p className="text-lg mt-2 text-primary-300">{profile.headline}</p>
              )}
            </div>
          </div>

          {/* Right: Score */}
          <div className="lg:ml-auto">
            <ScoreCircle
              score={result.score.overall}
              size="lg"
              label="Portfolio Score"
              className="text-white"
            />
          </div>
        </div>

        {/* Summary */}
        {profile?.summary && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-gray-300 leading-relaxed">{profile.summary}</p>
          </div>
        )}
      </div>

      {/* Skills Section */}
      <Card>
        <CardHeader title="Technical Skills" icon={<Code className="w-5 h-5 text-primary-600" />} />
        <div className="flex flex-wrap gap-2">
          {result.skills.length > 0 ? (
            result.skills.slice(0, 20).map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No skills detected yet. Run an analysis to extract skills from your repositories.</p>
          )}
        </div>
      </Card>

      {/* Top Projects */}
      <Card>
        <CardHeader title="Featured Projects" icon={<Star className="w-5 h-5 text-yellow-500" />} />
        <div className="space-y-4">
          {result.repositories.length > 0 ? (
            result.repositories
              .sort((a, b) => (b.stars || 0) - (a.stars || 0))
              .slice(0, 5)
              .map((repo, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{repo.name}</h3>
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    {repo.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {repo.language && <span className="text-primary-600">{repo.language}</span>}
                      <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {repo.stars || 0}</span>
                      <span className="flex items-center gap-1"><GitFork className="w-3 h-3" /> {repo.forks || 0}</span>
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No repositories found. Run an analysis to see your projects.</p>
          )}
        </div>
      </Card>

      {/* All Repositories */}
      <Card>
        <CardHeader title="All Repositories" icon={<Folder className="w-5 h-5 text-gray-600" />} />
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
          Complete list of analyzed repositories ({result.repositories.length} total)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {result.repositories.length > 0 ? (
            result.repositories.map((repo, index) => (
              <a
                key={index}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">{repo.name}</h4>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </div>
                {repo.description && (
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-2 line-clamp-2">{repo.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  {repo.language && <span className="text-primary-600">{repo.language}</span>}
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {repo.stars || 0}</span>
                </div>
              </a>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm col-span-3">No repositories found.</p>
          )}
        </div>
      </Card>

      {/* Highlights */}
      {profile?.highlights && profile.highlights.length > 0 && (
        <Card>
          <CardHeader title="Career Highlights" />
          <ul className="space-y-2">
            {profile.highlights.map((highlight, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span className="text-gray-700 dark:text-gray-300">{highlight}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Contact / Links */}
      <Card>
        <CardHeader title="Connect" />
        <div className="flex flex-wrap gap-4">
          {user?.username && (
            <a
              href={`https://github.com/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              GitHub Profile
            </a>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProfessionalProfilePage;
