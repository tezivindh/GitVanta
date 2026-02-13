// =====================================================
// PUBLIC PROFILE PAGE - Shareable portfolio view
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  GitFork,
  MapPin,
  Building2,
  Globe,
  ExternalLink,
  Trophy,
  Code,
  Folder,
  ArrowLeft,
  Github,
  Loader2,
  Linkedin,
  Instagram,
  Youtube,
  Twitter,
  Link as LinkIcon,
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface PublicProfile {
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  company: string;
  location: string;
  blog: string;
  profileUrl: string;
  followers: number;
  publicRepos: number;
  socialAccounts: { provider: string; url: string }[];
  overallScore: number;
  categoryScores: {
    codeQuality: number;
    documentation: number;
    activity: number;
    diversity: number;
    community: number;
    professionalism: number;
  };
  skills: {
    name: string;
    category: string;
    proficiency: string;
    projectCount: number;
  }[];
  badges: {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
  }[];
  repositories: {
    name: string;
    url: string;
    description: string | null;
    language: string | null;
    stars: number;
    forks: number;
    topics: string[];
  }[];
  generatedAt: string;
}

// Score color helper
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-blue-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-red-400';
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'from-green-500 to-emerald-600';
  if (score >= 60) return 'from-blue-500 to-indigo-600';
  if (score >= 40) return 'from-yellow-500 to-orange-600';
  return 'from-red-500 to-rose-600';
}

function getGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

// Language color map
const languageColors: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-400',
  Python: 'bg-green-500',
  Java: 'bg-red-500',
  'C++': 'bg-pink-500',
  C: 'bg-gray-500',
  'C#': 'bg-purple-500',
  Go: 'bg-cyan-500',
  Rust: 'bg-orange-600',
  Ruby: 'bg-red-600',
  PHP: 'bg-indigo-400',
  Swift: 'bg-orange-500',
  Kotlin: 'bg-purple-400',
  Dart: 'bg-blue-400',
  HTML: 'bg-orange-500',
  CSS: 'bg-blue-600',
  Shell: 'bg-green-600',
  Vue: 'bg-emerald-500',
};

// Proficiency badge colors
const proficiencyColors: Record<string, string> = {
  expert: 'bg-purple-100 text-purple-700 border-purple-200',
  advanced: 'bg-blue-100 text-blue-700 border-blue-200',
  intermediate: 'bg-green-100 text-green-700 border-green-200',
  beginner: 'bg-gray-100 text-gray-700 border-gray-200',
};

const PublicProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${API_BASE_URL}/profile/${username}`);
        if (response.data.success) {
          setProfile(response.data.data);
        } else {
          setError(response.data.error || 'Failed to load profile');
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError(err.response.data.error || 'Profile not found');
        } else {
          setError('Failed to load profile. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto" />
          <p className="mt-4 text-gray-400">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Github className="w-8 h-8 text-gray-500" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Profile Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'This portfolio does not exist.'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to GitVanta
          </Link>
        </div>
      </div>
    );
  }

  const featuredRepos = [...profile.repositories]
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 6);

  const categoryLabels: Record<string, string> = {
    codeQuality: 'Code Quality',
    documentation: 'Documentation',
    activity: 'Activity',
    diversity: 'Diversity',
    community: 'Community',
    professionalism: 'Professionalism',
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation bar */}
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg">
            <Github className="w-5 h-5" />
            GitVanta
          </Link>
          <a
            href={profile.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
          >
            <Github className="w-4 h-4" />
            View on GitHub
          </a>
        </div>
      </nav>

      {/* Hero section — profile + score */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-gray-950 to-gray-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-16">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8">
            {/* Left — Avatar, Name, Meta */}
            <div className="flex items-start gap-6 flex-1">
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="w-28 h-28 rounded-2xl border-2 border-gray-700 shadow-2xl"
              />
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-white truncate">
                  {profile.displayName}
                </h1>
                <p className="text-gray-400 text-lg mt-0.5">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-gray-300 mt-3 leading-relaxed max-w-xl">
                    {profile.bio}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-400">
                  {profile.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> {profile.location}
                    </span>
                  )}
                  {profile.company && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" /> {profile.company}
                    </span>
                  )}
                  {profile.blog && (
                    <a
                      href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300"
                    >
                      <Globe className="w-4 h-4" /> {profile.blog}
                    </a>
                  )}
                </div>
                {/* Social accounts */}
                {profile.socialAccounts.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {profile.socialAccounts.map((account, idx) => {
                      const url = account.url;
                      const provider = account.provider.toLowerCase();
                      let icon = <LinkIcon className="w-3.5 h-3.5" />;
                      let label = 'Link';
                      let colors = 'bg-gray-800 hover:bg-gray-700 text-gray-300';

                      if (url.includes('linkedin.com') || provider === 'linkedin') {
                        icon = <Linkedin className="w-3.5 h-3.5" />;
                        label = 'LinkedIn';
                        colors = 'bg-blue-900/40 hover:bg-blue-800/50 text-blue-300 border-blue-800/50';
                      } else if (url.includes('instagram.com') || provider === 'instagram') {
                        icon = <Instagram className="w-3.5 h-3.5" />;
                        label = 'Instagram';
                        colors = 'bg-pink-900/40 hover:bg-pink-800/50 text-pink-300 border-pink-800/50';
                      } else if (url.includes('youtube.com') || url.includes('youtu.be') || provider === 'youtube') {
                        icon = <Youtube className="w-3.5 h-3.5" />;
                        label = 'YouTube';
                        colors = 'bg-red-900/40 hover:bg-red-800/50 text-red-300 border-red-800/50';
                      } else if (url.includes('twitter.com') || url.includes('x.com') || provider === 'twitter') {
                        icon = <Twitter className="w-3.5 h-3.5" />;
                        label = 'Twitter/X';
                        colors = 'bg-sky-900/40 hover:bg-sky-800/50 text-sky-300 border-sky-800/50';
                      } else if (url.includes('mastodon') || provider === 'mastodon') {
                        icon = <Globe className="w-3.5 h-3.5" />;
                        label = 'Mastodon';
                        colors = 'bg-purple-900/40 hover:bg-purple-800/50 text-purple-300 border-purple-800/50';
                      } else if (url.includes('dev.to')) {
                        label = 'Dev.to';
                        colors = 'bg-gray-800 hover:bg-gray-700 text-gray-200';
                      } else if (url.includes('medium.com')) {
                        label = 'Medium';
                        colors = 'bg-gray-800 hover:bg-gray-700 text-gray-200';
                      } else if (url.includes('hashnode')) {
                        label = 'Hashnode';
                        colors = 'bg-blue-900/40 hover:bg-blue-800/50 text-blue-300 border-blue-800/50';
                      } else {
                        // Try to extract domain name
                        try {
                          const domain = new URL(url).hostname.replace('www.', '');
                          label = domain;
                        } catch {
                          label = 'Website';
                        }
                      }

                      return (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-transparent transition-all ${colors}`}
                        >
                          {icon}
                          {label}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right — Score card */}
            <div className="lg:ml-auto shrink-0">
              <div className={`w-44 h-44 rounded-2xl bg-linear-to-br ${getScoreBg(profile.overallScore)} p-0.5`}>
                <div className="w-full h-full rounded-2xl bg-gray-950 flex flex-col items-center justify-center">
                  <span className={`text-5xl font-bold ${getScoreColor(profile.overallScore)}`}>
                    {profile.overallScore}
                  </span>
                  <span className="text-gray-400 text-sm mt-1">out of 100</span>
                  <span className={`text-lg font-semibold mt-1 ${getScoreColor(profile.overallScore)}`}>
                    Grade {getGrade(profile.overallScore)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-6 mt-8 pt-6 border-t border-gray-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{profile.publicRepos}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Repos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{profile.followers}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{profile.badges.length}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Badges</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{profile.skills.length}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Skills</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-12">

        {/* Category Scores */}
        <section>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Score Breakdown
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(profile.categoryScores).map(([key, score]) => (
              <div
                key={key}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center"
              >
                <p className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</p>
                <p className="text-xs text-gray-500 mt-1">{categoryLabels[key] || key}</p>
                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-linear-to-r ${getScoreBg(score)}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Badges */}
        {profile.badges.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Achievements
            </h2>
            <div className="flex flex-wrap gap-3">
              {profile.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="group relative inline-flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-full hover:border-yellow-600/50 hover:bg-gray-800 transition-all"
                >
                  <span className="text-yellow-400">★</span>
                  <span className="text-sm font-medium text-gray-200">{badge.name}</span>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-gray-800 text-gray-300 text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap border border-gray-700">
                      {badge.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {profile.skills.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-400" />
              Technical Skills
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {profile.skills.slice(0, 18).map((skill) => (
                <div
                  key={skill.name}
                  className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${languageColors[skill.name] || 'bg-gray-500'}`} />
                    <span className="text-sm font-medium text-gray-200">{skill.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${proficiencyColors[skill.proficiency] || proficiencyColors.beginner}`}>
                    {skill.proficiency}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Featured Projects */}
        {featuredRepos.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Featured Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredRepos.map((repo) => (
                <a
                  key={repo.name}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-blue-400" />
                      <h3 className="font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                        {repo.name}
                      </h3>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </div>
                  {repo.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {repo.language && (
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${languageColors[repo.language] || 'bg-gray-500'}`} />
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" /> {repo.stars}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3 h-3" /> {repo.forks}
                    </span>
                  </div>
                  {repo.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {repo.topics.slice(0, 4).map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-xs"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* All Repositories */}
        {profile.repositories.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Folder className="w-5 h-5 text-gray-400" />
              All Repositories
            </h2>
            <p className="text-gray-500 text-sm mb-6">{profile.repositories.length} public repositories</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {profile.repositories.map((repo) => (
                <a
                  key={repo.name}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-blue-400 group-hover:text-blue-300 text-sm truncate">
                      {repo.name}
                    </h4>
                    <ExternalLink className="w-3 h-3 text-gray-600 shrink-0" />
                  </div>
                  {repo.description && (
                    <p className="text-gray-500 text-xs mb-2 line-clamp-2">{repo.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${languageColors[repo.language] || 'bg-gray-500'}`} />
                        {repo.language}
                      </span>
                    )}
                    {repo.stars > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" /> {repo.stars}
                      </span>
                    )}
                    {repo.forks > 0 && (
                      <span className="flex items-center gap-1">
                        <GitFork className="w-3 h-3" /> {repo.forks}
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Github className="w-4 h-4" />
            <span>Generated with <strong className="text-gray-300">GitVanta</strong></span>
          </div>
          <p className="text-gray-600 text-xs">
            Last analyzed: {new Date(profile.generatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicProfilePage;
