import React, { useState, useMemo } from 'react';
import { ExternalLink, Star, GitFork, Search, Filter, ChevronDown } from 'lucide-react';
import { useAnalysisStore } from '../../store/analysisStore';
import { Card, Input, Button, ProgressBar, Alert } from '../../components/ui';

type SortOption = 'stars' | 'forks' | 'name' | 'updated';

const RepositoriesPage: React.FC = () => {
  const { currentReport } = useAnalysisStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('stars');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const repositories = currentReport?.result.repositories || [];

  // Get unique languages
  const languages = useMemo(() => {
    const langs = new Set(repositories.map((r) => r.language).filter(Boolean));
    return Array.from(langs).sort();
  }, [repositories]);

  // Filter and sort repositories
  const filteredRepos = useMemo(() => {
    let filtered = [...repositories];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (repo) =>
          repo.name.toLowerCase().includes(query) ||
          repo.description?.toLowerCase().includes(query)
      );
    }

    // Language filter
    if (filterLanguage !== 'all') {
      filtered = filtered.filter((repo) => repo.language === filterLanguage);
    }

    // Sort
    switch (sortBy) {
      case 'stars':
        filtered.sort((a, b) => (b.stars || 0) - (a.stars || 0));
        break;
      case 'forks':
        filtered.sort((a, b) => (b.forks || 0) - (a.forks || 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'updated':
        filtered.sort(
          (a, b) =>
            new Date(b.updatedAt || 0).getTime() -
            new Date(a.updatedAt || 0).getTime()
        );
        break;
    }

    return filtered;
  }, [repositories, searchQuery, filterLanguage, sortBy]);

  if (!currentReport) {
    return (
      <Alert variant="info" title="No Analysis Found">
        Run an analysis from the dashboard to see your repositories.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Repositories</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {repositories.length} repositories analyzed
        </p>
      </div>

      {/* Search and Filters */}
      <Card padding="compact">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1 w-full">
            <Input
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            rightIcon={<ChevronDown className="w-4 h-4" />}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="block w-40 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
              >
                <option value="stars">Stars</option>
                <option value="forks">Forks</option>
                <option value="name">Name</option>
                <option value="updated">Last Updated</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Language
              </label>
              <select
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
                className="block w-40 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
              >
                <option value="all">All Languages</option>
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Card>

      {/* Repository List */}
      <div className="space-y-4">
        {filteredRepos.map((repo, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              {/* Main Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                    {repo.name}
                  </h3>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {repo.description && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {repo.description}
                  </p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {repo.language && (
                    <span className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-sm text-sm">
                      {repo.language}
                    </span>
                  )}
                  {repo.topics?.map((topic) => (
                    <span
                      key={topic}
                      className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-sm text-sm"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 lg:gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>{repo.stars || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <GitFork className="w-4 h-4" />
                  <span>{repo.forks || 0}</span>
                </div>
              </div>

              {/* Score (if available) */}
              {repo.score !== undefined && (
                <div className="lg:w-32">
                  <ProgressBar
                    value={repo.score}
                    max={100}
                    size="sm"
                    showValue
                  />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {filteredRepos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No repositories match your filters.</p>
          <Button
            variant="ghost"
            className="mt-2"
            onClick={() => {
              setSearchQuery('');
              setFilterLanguage('all');
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default RepositoriesPage;
