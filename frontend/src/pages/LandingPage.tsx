// =====================================================
// LANDING PAGE - Home page with features showcase
// =====================================================

import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Github,
  BarChart3,
  Sparkles,
  Brain,
  Trophy,
  FileDown,
  Users,
  GitCompare,
  ArrowRight,
  Check,
  Share2,
  Globe,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui';

const features = [
  {
    icon: BarChart3,
    title: 'Portfolio Analytics',
    description:
      'Get a comprehensive 0-100 score with transparent breakdowns across 6 categories.',
  },
  {
    icon: Brain,
    title: 'Skill Extraction',
    description:
      'Automatically detect and categorize your technical skills from repository analysis.',
  },
  {
    icon: Sparkles,
    title: 'AI Enhancements',
    description:
      'Generate improved READMEs, resume bullets, and portfolio summaries with Gemini AI.',
  },
  {
    icon: Trophy,
    title: 'Badge System',
    description:
      'Earn badges for achievements like Open Source Contributor, Polyglot, and more.',
  },
  {
    icon: Users,
    title: 'Professional View',
    description:
      'A shareable public profile page showcasing your scores, skills, badges, and top projects.',
  },
  {
    icon: Share2,
    title: 'Shareable Profile Link',
    description:
      'Copy and share your public portfolio link — perfect for resumes, LinkedIn, and job applications.',
  },
  {
    icon: GitCompare,
    title: 'Profile Comparison',
    description:
      'Compare your portfolio against other developers to identify growth opportunities.',
  },
  {
    icon: Globe,
    title: 'Social Presence Scoring',
    description:
      'Connect your socials on GitHub and earn professionalism points for LinkedIn, Instagram, and more.',
  },
  {
    icon: FileDown,
    title: 'PDF Export',
    description:
      'Export your analysis as a professional PDF for interviews and applications.',
  },
];

const benefits = [
  'Transparent scoring with detailed breakdowns',
  'AI-powered improvement suggestions',
  'Track your progress over time',
  'Shareable public portfolio link',
  'Social presence & professionalism scoring',
  '19 achievement badges to unlock',
  'Identify skill gaps and weaknesses',
  'Export professional reports',
];

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  // Redirect logged-in users straight to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Github className="w-8 h-8 text-primary-600" />
              <span className="font-bold text-xl text-gray-900">
                GitVanta
              </span>
            </Link>

            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button variant="primary">Go to Dashboard</Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button variant="primary" leftIcon={<Github className="w-4 h-4" />}>
                    Sign in with GitHub
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight">
            Your GitHub, Scored &
            <span className="text-primary-600"> Supercharged</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            GitVanta gives your GitHub profile a transparent 0-100 score across 6 categories,
            AI-powered enhancements, a shareable professional portfolio, and actionable insights
            to level up as a developer.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <Button
                size="lg"
                variant="primary"
                leftIcon={<Github className="w-5 h-5" />}
              >
                Get Started Free
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" rightIcon={<ArrowRight className="w-4 h-4" />}>
                View Features
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-4 gap-8 max-w-3xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-primary-600">6</div>
              <div className="text-sm text-gray-500 mt-1">Score Categories</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600">19</div>
              <div className="text-sm text-gray-500 mt-1">Badges to Earn</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600">100%</div>
              <div className="text-sm text-gray-500 mt-1">Transparent</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600">AI</div>
              <div className="text-sm text-gray-500 mt-1">Powered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              Everything You Need to Showcase Your Skills
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Comprehensive tools to analyze, improve, and present your developer portfolio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-xs border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Developers Love GitVanta
              </h2>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-linear-to-br from-primary-500 to-primary-700 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Get Your Score Today</h3>
              <p className="mb-6 text-primary-100">
                Connect your GitHub account and receive a comprehensive analysis
                in minutes.
              </p>
              <Link to="/login">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-primary-600 hover:bg-gray-100"
                  leftIcon={<Github className="w-5 h-5" />}
                >
                  Sign in with GitHub
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Github className="w-6 h-6" />
              <span className="font-semibold">GitVanta</span>
            </div>
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} GitVanta — Built for developers who want to showcase their best work.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
