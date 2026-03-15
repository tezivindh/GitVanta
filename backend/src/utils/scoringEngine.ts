// =====================================================
// Categories:
// 1. Code Quality (25% weight)
// 2. Documentation (20% weight)
// 3. Activity (20% weight)
// 4. Diversity (15% weight)
// 5. Community (10% weight)
// 6. Professionalism (10% weight)
// =====================================================

import {
  GitHubRepository,
  CategoryScores,
  DetailedBreakdown,
  BreakdownItem,
  ExtractedSkill,
  Weakness,
  Improvement,
  Badge,
} from '../types';

// =====================================================
// WEIGHT CONFIGURATION
// =====================================================

const CATEGORY_WEIGHTS = {
  codeQuality: 0.25,
  documentation: 0.20,
  activity: 0.20,
  diversity: 0.15,
  community: 0.10,
  professionalism: 0.10,
};

// =====================================================
// SCORING RESULT INTERFACE
// =====================================================

export interface ScoringResult {
  overallScore: number;
  categoryScores: CategoryScores;
  detailedBreakdown: DetailedBreakdown;
}

// =====================================================
// CODE QUALITY SCORER
// =====================================================

interface CodeQualityInput {
  repos: GitHubRepository[];
  languages: Record<string, number>[];
  hasTests: boolean[];
  hasLinting: boolean[];
  avgCommitSize: number[];
}

export function scoreCodeQuality(input: CodeQualityInput): {
  score: number;
  breakdown: BreakdownItem[];
} {
  const breakdown: BreakdownItem[] = [];
  let totalScore = 0;
  const maxScore = 100;

  // 1. Repository Size & Structure (25 points max)
  const repoCount = input.repos.length;
  const sizeScore = Math.min(25, repoCount * 2.5);
  breakdown.push({
    metric: 'Repository Portfolio Size',
    score: Math.round(sizeScore),
    maxScore: 25,
    description: `${repoCount} public repositories`,
    suggestion: repoCount < 10 ? 'Consider creating more public repositories to showcase your work' : undefined,
  });
  totalScore += sizeScore;

  // 2. Language Diversity in Code (25 points max)
  const uniqueLanguages = new Set<string>();
  input.languages.forEach(langObj => {
    Object.keys(langObj).forEach(lang => uniqueLanguages.add(lang));
  });
  const langDiversityScore = Math.min(25, uniqueLanguages.size * 3);
  breakdown.push({
    metric: 'Language Diversity',
    score: Math.round(langDiversityScore),
    maxScore: 25,
    description: `${uniqueLanguages.size} programming languages used`,
    suggestion: uniqueLanguages.size < 5 ? 'Try learning and using more programming languages' : undefined,
  });
  totalScore += langDiversityScore;

  // 3. Testing Presence (25 points max)
  const reposWithTests = input.hasTests.filter(Boolean).length;
  const testPercentage = repoCount > 0 ? (reposWithTests / repoCount) * 100 : 0;
  const testScore = (testPercentage / 100) * 25;
  breakdown.push({
    metric: 'Test Coverage Presence',
    score: Math.round(testScore),
    maxScore: 25,
    description: `${Math.round(testPercentage)}% of repos have tests`,
    suggestion: testPercentage < 50 ? 'Add tests to more of your repositories' : undefined,
  });
  totalScore += testScore;

  // 4. Commit Quality (25 points max)
  const avgCommits = input.avgCommitSize.length > 0 
    ? input.avgCommitSize.reduce((a, b) => a + b, 0) / input.avgCommitSize.length 
    : 0;
  // Ideal commit size is between 50-200 lines
  let commitScore = 25;
  if (avgCommits < 10) commitScore = 10;
  else if (avgCommits > 500) commitScore = 15;
  else if (avgCommits >= 50 && avgCommits <= 200) commitScore = 25;
  else commitScore = 20;
  
  breakdown.push({
    metric: 'Commit Quality',
    score: Math.round(commitScore),
    maxScore: 25,
    description: `Average commit size suggests ${commitScore >= 20 ? 'good' : 'improvable'} practices`,
    suggestion: commitScore < 20 ? 'Make smaller, more focused commits' : undefined,
  });
  totalScore += commitScore;

  return {
    score: Math.min(100, Math.round(totalScore)),
    breakdown,
  };
}

// =====================================================
// DOCUMENTATION SCORER
// =====================================================

interface DocumentationInput {
  repos: GitHubRepository[];
  hasReadme: boolean[];
  readmeLength: number[];
  hasLicense: boolean[];
  hasContributing: boolean[];
  hasCodeOfConduct: boolean[];
}

export function scoreDocumentation(input: DocumentationInput): {
  score: number;
  breakdown: BreakdownItem[];
} {
  const breakdown: BreakdownItem[] = [];
  let totalScore = 0;
  const repoCount = input.repos.length || 1;

  // 1. README Presence (30 points max)
  const reposWithReadme = input.hasReadme.filter(Boolean).length;
  const readmePercentage = (reposWithReadme / repoCount) * 100;
  const readmePresenceScore = (readmePercentage / 100) * 30;
  breakdown.push({
    metric: 'README Presence',
    score: Math.round(readmePresenceScore),
    maxScore: 30,
    description: `${Math.round(readmePercentage)}% of repos have README files`,
    suggestion: readmePercentage < 80 ? 'Add README files to all your repositories' : undefined,
  });
  totalScore += readmePresenceScore;

  // 2. README Quality (30 points max)
  const avgReadmeLength = input.readmeLength.length > 0
    ? input.readmeLength.reduce((a, b) => a + b, 0) / input.readmeLength.length
    : 0;
  // Good README is 500-2000 characters
  let readmeQualityScore = 0;
  if (avgReadmeLength >= 1000) readmeQualityScore = 30;
  else if (avgReadmeLength >= 500) readmeQualityScore = 25;
  else if (avgReadmeLength >= 200) readmeQualityScore = 15;
  else if (avgReadmeLength > 0) readmeQualityScore = 10;
  
  breakdown.push({
    metric: 'README Quality',
    score: Math.round(readmeQualityScore),
    maxScore: 30,
    description: `Average README length: ${Math.round(avgReadmeLength)} characters`,
    suggestion: avgReadmeLength < 500 ? 'Write more comprehensive README files with setup instructions, features, and examples' : undefined,
  });
  totalScore += readmeQualityScore;

  // 3. License Presence (20 points max)
  const reposWithLicense = input.hasLicense.filter(Boolean).length;
  const licensePercentage = (reposWithLicense / repoCount) * 100;
  const licenseScore = (licensePercentage / 100) * 20;
  breakdown.push({
    metric: 'License Presence',
    score: Math.round(licenseScore),
    maxScore: 20,
    description: `${Math.round(licensePercentage)}% of repos have licenses`,
    suggestion: licensePercentage < 80 ? 'Add open source licenses to your repositories' : undefined,
  });
  totalScore += licenseScore;

  // 4. Contributing Guidelines (20 points max)
  const reposWithContributing = input.hasContributing.filter(Boolean).length;
  const contributingPercentage = (reposWithContributing / repoCount) * 100;
  const contributingScore = (contributingPercentage / 100) * 20;
  breakdown.push({
    metric: 'Contributing Guidelines',
    score: Math.round(contributingScore),
    maxScore: 20,
    description: `${Math.round(contributingPercentage)}% of repos have contributing guidelines`,
    suggestion: contributingPercentage < 30 ? 'Add CONTRIBUTING.md files to encourage collaboration' : undefined,
  });
  totalScore += contributingScore;

  return {
    score: Math.min(100, Math.round(totalScore)),
    breakdown,
  };
}

// =====================================================
// ACTIVITY SCORER
// =====================================================

interface ActivityInput {
  repos: GitHubRepository[];
  commitDates: Date[][];
  lastPushDates: Date[];
  accountAge: number; // in days
}

export function scoreActivity(input: ActivityInput): {
  score: number;
  breakdown: BreakdownItem[];
} {
  const breakdown: BreakdownItem[] = [];
  let totalScore = 0;
  const now = new Date();

  // 1. Recent Activity (35 points max)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentPushes = input.lastPushDates.filter(date => new Date(date) > thirtyDaysAgo).length;
  const recentActivityScore = Math.min(35, recentPushes * 7);
  breakdown.push({
    metric: 'Recent Activity',
    score: Math.round(recentActivityScore),
    maxScore: 35,
    description: `${recentPushes} repositories updated in the last 30 days`,
    suggestion: recentPushes < 3 ? 'Try to commit more frequently to show consistent activity' : undefined,
  });
  totalScore += recentActivityScore;

  // 2. Commit Consistency (35 points max)
  const allCommitDates = input.commitDates.flat();
  const uniqueCommitDays = new Set(
    allCommitDates.map(d => new Date(d).toISOString().split('T')[0])
  ).size;
  const consistencyScore = Math.min(35, uniqueCommitDays * 0.5);
  breakdown.push({
    metric: 'Commit Consistency',
    score: Math.round(consistencyScore),
    maxScore: 35,
    description: `${uniqueCommitDays} unique days with commits`,
    suggestion: uniqueCommitDays < 50 ? 'Maintain a more consistent coding schedule' : undefined,
  });
  totalScore += consistencyScore;

  // 3. Repository Freshness (30 points max)
  const repoCount = input.repos.length || 1;
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const activeRepos = input.lastPushDates.filter(date => new Date(date) > oneYearAgo).length;
  const freshnessPercentage = (activeRepos / repoCount) * 100;
  const freshnessScore = (freshnessPercentage / 100) * 30;
  breakdown.push({
    metric: 'Repository Freshness',
    score: Math.round(freshnessScore),
    maxScore: 30,
    description: `${Math.round(freshnessPercentage)}% of repos updated in the last year`,
    suggestion: freshnessPercentage < 50 ? 'Update or archive inactive repositories' : undefined,
  });
  totalScore += freshnessScore;

  return {
    score: Math.min(100, Math.round(totalScore)),
    breakdown,
  };
}

// =====================================================
// DIVERSITY SCORER
// =====================================================

interface DiversityInput {
  repos: GitHubRepository[];
  languages: Record<string, number>[];
  topics: string[][];
}

export function scoreDiversity(input: DiversityInput): {
  score: number;
  breakdown: BreakdownItem[];
} {
  const breakdown: BreakdownItem[] = [];
  let totalScore = 0;

  // 1. Language Diversity (40 points max)
  const allLanguages = new Set<string>();
  input.languages.forEach(langObj => {
    Object.keys(langObj).forEach(lang => allLanguages.add(lang));
  });
  const languageScore = Math.min(40, allLanguages.size * 4);
  breakdown.push({
    metric: 'Language Diversity',
    score: Math.round(languageScore),
    maxScore: 40,
    description: `${allLanguages.size} different programming languages`,
    suggestion: allLanguages.size < 5 ? 'Explore projects in different programming languages' : undefined,
  });
  totalScore += languageScore;

  // 2. Topic Diversity (30 points max)
  const allTopics = new Set<string>();
  input.topics.forEach(topicsArr => {
    topicsArr.forEach(topic => allTopics.add(topic.toLowerCase()));
  });
  const topicScore = Math.min(30, allTopics.size * 2);
  breakdown.push({
    metric: 'Topic Diversity',
    score: Math.round(topicScore),
    maxScore: 30,
    description: `${allTopics.size} different topics/tags used`,
    suggestion: allTopics.size < 10 ? 'Add more topics to your repositories to improve discoverability' : undefined,
  });
  totalScore += topicScore;

  // 3. Project Type Diversity (30 points max)
  const projectTypes = categorizeProjects(input.repos);
  const typeScore = Math.min(30, Object.keys(projectTypes).length * 6);
  breakdown.push({
    metric: 'Project Type Diversity',
    score: Math.round(typeScore),
    maxScore: 30,
    description: `${Object.keys(projectTypes).length} different project types`,
    suggestion: Object.keys(projectTypes).length < 3 ? 'Work on different types of projects (web, CLI, library, etc.)' : undefined,
  });
  totalScore += typeScore;

  return {
    score: Math.min(100, Math.round(totalScore)),
    breakdown,
  };
}

function categorizeProjects(repos: GitHubRepository[]): Record<string, number> {
  const types: Record<string, number> = {};
  
  repos.forEach(repo => {
    const topics = repo.topics.map(t => t.toLowerCase());
    const name = repo.name.toLowerCase();
    const desc = (repo.description || '').toLowerCase();
    
    if (topics.some(t => ['cli', 'command-line', 'terminal'].includes(t)) || name.includes('cli')) {
      types['CLI Tool'] = (types['CLI Tool'] || 0) + 1;
    }
    if (topics.some(t => ['web', 'website', 'webapp', 'frontend'].includes(t)) || desc.includes('web')) {
      types['Web Application'] = (types['Web Application'] || 0) + 1;
    }
    if (topics.some(t => ['api', 'backend', 'server', 'rest'].includes(t))) {
      types['API/Backend'] = (types['API/Backend'] || 0) + 1;
    }
    if (topics.some(t => ['library', 'package', 'npm', 'pip'].includes(t))) {
      types['Library'] = (types['Library'] || 0) + 1;
    }
    if (topics.some(t => ['mobile', 'android', 'ios', 'react-native', 'flutter'].includes(t))) {
      types['Mobile App'] = (types['Mobile App'] || 0) + 1;
    }
    if (topics.some(t => ['ml', 'machine-learning', 'ai', 'deep-learning', 'data-science'].includes(t))) {
      types['ML/AI'] = (types['ML/AI'] || 0) + 1;
    }
    if (topics.some(t => ['devops', 'docker', 'kubernetes', 'ci-cd', 'infrastructure'].includes(t))) {
      types['DevOps'] = (types['DevOps'] || 0) + 1;
    }
  });

  // If no specific type found, mark as general
  if (Object.keys(types).length === 0 && repos.length > 0) {
    types['General'] = repos.length;
  }

  return types;
}

// =====================================================
// COMMUNITY SCORER
// =====================================================

interface CommunityInput {
  repos: GitHubRepository[];
  followers: number;
  following: number;
  totalStars: number;
  totalForks: number;
}

export function scoreCommunity(input: CommunityInput): {
  score: number;
  breakdown: BreakdownItem[];
} {
  const breakdown: BreakdownItem[] = [];
  let totalScore = 0;

  // 1. Followers (25 points max)
  const followerScore = Math.min(25, Math.sqrt(input.followers) * 2.5);
  breakdown.push({
    metric: 'Follower Count',
    score: Math.round(followerScore),
    maxScore: 25,
    description: `${input.followers} followers`,
    suggestion: input.followers < 10 ? 'Engage more with the community to grow your following' : undefined,
  });
  totalScore += followerScore;

  // 2. Stars Received (30 points max)
  const starScore = Math.min(30, Math.sqrt(input.totalStars) * 3);
  breakdown.push({
    metric: 'Stars Received',
    score: Math.round(starScore),
    maxScore: 30,
    description: `${input.totalStars} total stars across all repositories`,
    suggestion: input.totalStars < 50 ? 'Create more useful projects and promote them to earn stars' : undefined,
  });
  totalScore += starScore;

  // 3. Forks (25 points max)
  const forkScore = Math.min(25, Math.sqrt(input.totalForks) * 5);
  breakdown.push({
    metric: 'Repository Forks',
    score: Math.round(forkScore),
    maxScore: 25,
    description: `${input.totalForks} total forks`,
    suggestion: input.totalForks < 10 ? 'Build projects others want to contribute to' : undefined,
  });
  totalScore += forkScore;

  // 4. Network Engagement (20 points max)
  const ratio = input.followers > 0 ? input.following / input.followers : 0;
  let engagementScore = 20;
  if (ratio > 5) engagementScore = 5; // Following too many
  else if (ratio > 2) engagementScore = 10;
  else if (ratio >= 0.5 && ratio <= 2) engagementScore = 20; // Healthy ratio
  else if (ratio < 0.2 && input.following < 10) engagementScore = 10; // Not following others
  
  breakdown.push({
    metric: 'Network Balance',
    score: Math.round(engagementScore),
    maxScore: 20,
    description: `Following ${input.following} users with ${input.followers} followers`,
    suggestion: engagementScore < 15 ? 'Balance following others while building your follower base' : undefined,
  });
  totalScore += engagementScore;

  return {
    score: Math.min(100, Math.round(totalScore)),
    breakdown,
  };
}

// =====================================================
// PROFESSIONALISM SCORER
// =====================================================

interface ProfessionalismInput {
  hasProfileReadme: boolean;
  hasBio: boolean;
  hasCompany: boolean;
  hasLocation: boolean;
  hasWebsite: boolean;
  hasEmail: boolean;
  hasTwitter: boolean;
  blogUrl: string;
  socialAccounts: { provider: string; url: string }[];
  profileComplete: number; // percentage
  repos: GitHubRepository[];
}

export function scoreProfessionalism(input: ProfessionalismInput): {
  score: number;
  breakdown: BreakdownItem[];
} {
  const breakdown: BreakdownItem[] = [];
  let totalScore = 0;

  // 1. Profile Completeness (25 points max)
  let profileItems = 0;
  if (input.hasBio) profileItems++;
  if (input.hasCompany) profileItems++;
  if (input.hasLocation) profileItems++;
  if (input.hasWebsite) profileItems++;
  if (input.hasEmail) profileItems++;
  const profileScore = (profileItems / 5) * 25;
  breakdown.push({
    metric: 'Profile Completeness',
    score: Math.round(profileScore),
    maxScore: 25,
    description: `${profileItems}/5 profile fields completed`,
    suggestion: profileItems < 4 ? 'Complete your GitHub profile with bio, location, and website' : undefined,
  });
  totalScore += profileScore;

  // 2. Profile README (20 points max)
  const profileReadmeScore = input.hasProfileReadme ? 20 : 0;
  breakdown.push({
    metric: 'Profile README',
    score: profileReadmeScore,
    maxScore: 20,
    description: input.hasProfileReadme ? 'Has profile README' : 'No profile README',
    suggestion: !input.hasProfileReadme ? 'Create a profile README to introduce yourself' : undefined,
  });
  totalScore += profileReadmeScore;

  // 3. Social Presence (15 points max)
  const socialLinks: string[] = [];
  let socialScore = 0;

  // Map of known social providers and their display names
  const providerNames: Record<string, string> = {
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    twitter: 'Twitter/X',
    youtube: 'YouTube',
    mastodon: 'Mastodon',
    npm: 'npm',
    generic: 'Website',
  };

  // Check GitHub social accounts API (3 points each, up to 4 accounts = 12 pts)
  const seenProviders = new Set<string>();
  for (const account of input.socialAccounts) {
    const provider = account.provider.toLowerCase();
    if (seenProviders.has(provider)) continue;
    seenProviders.add(provider);

    const displayName = providerNames[provider] || provider;

    // Detect specific platforms from generic URLs too
    if (provider === 'generic') {
      const url = account.url.toLowerCase();
      if (url.includes('linkedin.com') && !seenProviders.has('linkedin')) {
        socialLinks.push('LinkedIn');
        seenProviders.add('linkedin');
      } else if (url.includes('instagram.com') && !seenProviders.has('instagram')) {
        socialLinks.push('Instagram');
        seenProviders.add('instagram');
      } else if (url.includes('youtube.com') && !seenProviders.has('youtube')) {
        socialLinks.push('YouTube');
        seenProviders.add('youtube');
      } else {
        socialLinks.push('Website');
      }
    } else {
      socialLinks.push(displayName);
    }

    socialScore += 3;
    if (socialScore >= 12) break;
  }

  // Twitter/X username from profile (3 points, if not already counted)
  if (input.hasTwitter && !seenProviders.has('twitter')) {
    socialScore += 3;
    socialLinks.push('Twitter/X');
  }

  breakdown.push({
    metric: 'Social Presence',
    score: Math.min(15, socialScore),
    maxScore: 15,
    description: socialLinks.length > 0
      ? `Connected: ${socialLinks.join(', ')}`
      : 'No social links detected',
    suggestion: socialLinks.length === 0
      ? 'Link your socials on GitHub — go to your profile and add LinkedIn, Instagram, Twitter, etc.'
      : socialScore < 9
        ? 'Add more social accounts to your GitHub profile for a higher score'
        : undefined,
  });
  totalScore += Math.min(15, socialScore);

  // 4. Repository Naming (20 points max)
  const wellNamedRepos = input.repos.filter(repo => {
    const name = repo.name;
    // Check for professional naming conventions
    return name.match(/^[a-z0-9]+(-[a-z0-9]+)*$/) || // kebab-case
           name.match(/^[a-z][a-zA-Z0-9]*$/) || // camelCase
           name.match(/^[A-Z][a-zA-Z0-9]*$/); // PascalCase
  }).length;
  const namingPercentage = input.repos.length > 0 ? (wellNamedRepos / input.repos.length) * 100 : 0;
  const namingScore = (namingPercentage / 100) * 20;
  breakdown.push({
    metric: 'Repository Naming',
    score: Math.round(namingScore),
    maxScore: 20,
    description: `${Math.round(namingPercentage)}% of repos follow naming conventions`,
    suggestion: namingPercentage < 80 ? 'Use consistent naming conventions for repositories' : undefined,
  });
  totalScore += namingScore;

  // 5. Repository Descriptions (20 points max)
  const reposWithDesc = input.repos.filter(repo => 
    repo.description && repo.description.length >= 20
  ).length;
  const descPercentage = input.repos.length > 0 ? (reposWithDesc / input.repos.length) * 100 : 0;
  const descScore = (descPercentage / 100) * 20;
  breakdown.push({
    metric: 'Repository Descriptions',
    score: Math.round(descScore),
    maxScore: 20,
    description: `${Math.round(descPercentage)}% of repos have meaningful descriptions`,
    suggestion: descPercentage < 80 ? 'Add clear descriptions to all your repositories' : undefined,
  });
  totalScore += descScore;

  return {
    score: Math.min(100, Math.round(totalScore)),
    breakdown,
  };
}

// =====================================================
// MAIN SCORING FUNCTION
// =====================================================

export interface FullScoringInput {
  codeQuality: CodeQualityInput;
  documentation: DocumentationInput;
  activity: ActivityInput;
  diversity: DiversityInput;
  community: CommunityInput;
  professionalism: ProfessionalismInput;
}

export function calculateFullScore(input: FullScoringInput): ScoringResult {
  // Calculate individual category scores
  const codeQualityResult = scoreCodeQuality(input.codeQuality);
  const documentationResult = scoreDocumentation(input.documentation);
  const activityResult = scoreActivity(input.activity);
  const diversityResult = scoreDiversity(input.diversity);
  const communityResult = scoreCommunity(input.community);
  const professionalismResult = scoreProfessionalism(input.professionalism);

  // Build category scores
  const categoryScores: CategoryScores = {
    codeQuality: codeQualityResult.score,
    documentation: documentationResult.score,
    activity: activityResult.score,
    diversity: diversityResult.score,
    community: communityResult.score,
    professionalism: professionalismResult.score,
  };

  // Build detailed breakdown
  const detailedBreakdown: DetailedBreakdown = {
    codeQuality: codeQualityResult.breakdown,
    documentation: documentationResult.breakdown,
    activity: activityResult.breakdown,
    diversity: diversityResult.breakdown,
    community: communityResult.breakdown,
    professionalism: professionalismResult.breakdown,
  };

  // Calculate weighted overall score
  const overallScore = Math.round(
    categoryScores.codeQuality * CATEGORY_WEIGHTS.codeQuality +
    categoryScores.documentation * CATEGORY_WEIGHTS.documentation +
    categoryScores.activity * CATEGORY_WEIGHTS.activity +
    categoryScores.diversity * CATEGORY_WEIGHTS.diversity +
    categoryScores.community * CATEGORY_WEIGHTS.community +
    categoryScores.professionalism * CATEGORY_WEIGHTS.professionalism
  );

  return {
    overallScore,
    categoryScores,
    detailedBreakdown,
  };
}

// =====================================================
// SKILL EXTRACTION
// =====================================================

export function extractSkills(
  languages: Record<string, number>[],
  repos: GitHubRepository[]
): ExtractedSkill[] {
  const skills: Map<string, ExtractedSkill> = new Map();

  // Extract language skills
  const languageTotals: Record<string, { bytes: number; count: number }> = {};
  
  languages.forEach(langObj => {
    Object.entries(langObj).forEach(([lang, bytes]) => {
      if (!languageTotals[lang]) {
        languageTotals[lang] = { bytes: 0, count: 0 };
      }
      languageTotals[lang].bytes += bytes;
      languageTotals[lang].count += 1;
    });
  });

  // Add language skills
  Object.entries(languageTotals).forEach(([lang, data]) => {
    const proficiency = determineProficiency(data.count, data.bytes);
    skills.set(lang, {
      name: lang,
      category: 'language',
      proficiency,
      projectCount: data.count,
      totalLines: Math.round(data.bytes / 50), // Rough estimate
    });
  });

  // Extract framework/tool skills from topics
  const topicCounts: Record<string, number> = {};
  repos.forEach(repo => {
    repo.topics.forEach(topic => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
  });

  // Map common topics to skills
  const frameworkMap: Record<string, { name: string; category: ExtractedSkill['category'] }> = {
    'react': { name: 'React', category: 'framework' },
    'reactjs': { name: 'React', category: 'framework' },
    'vue': { name: 'Vue.js', category: 'framework' },
    'vuejs': { name: 'Vue.js', category: 'framework' },
    'angular': { name: 'Angular', category: 'framework' },
    'nodejs': { name: 'Node.js', category: 'framework' },
    'express': { name: 'Express.js', category: 'framework' },
    'django': { name: 'Django', category: 'framework' },
    'flask': { name: 'Flask', category: 'framework' },
    'nextjs': { name: 'Next.js', category: 'framework' },
    'docker': { name: 'Docker', category: 'tool' },
    'kubernetes': { name: 'Kubernetes', category: 'tool' },
    'aws': { name: 'AWS', category: 'cloud' },
    'gcp': { name: 'Google Cloud', category: 'cloud' },
    'azure': { name: 'Azure', category: 'cloud' },
    'mongodb': { name: 'MongoDB', category: 'database' },
    'postgresql': { name: 'PostgreSQL', category: 'database' },
    'mysql': { name: 'MySQL', category: 'database' },
    'redis': { name: 'Redis', category: 'database' },
    'graphql': { name: 'GraphQL', category: 'tool' },
    'rest-api': { name: 'REST API', category: 'tool' },
    'ci-cd': { name: 'CI/CD', category: 'tool' },
    'terraform': { name: 'Terraform', category: 'tool' },
  };

  Object.entries(topicCounts).forEach(([topic, count]) => {
    const mapping = frameworkMap[topic.toLowerCase()];
    if (mapping && !skills.has(mapping.name)) {
      skills.set(mapping.name, {
        name: mapping.name,
        category: mapping.category,
        proficiency: count >= 5 ? 'advanced' : count >= 2 ? 'intermediate' : 'beginner',
        projectCount: count,
      });
    }
  });

  return Array.from(skills.values()).sort((a, b) => b.projectCount - a.projectCount);
}

function determineProficiency(
  projectCount: number,
  totalBytes: number
): ExtractedSkill['proficiency'] {
  if (projectCount >= 10 || totalBytes >= 500000) return 'expert';
  if (projectCount >= 5 || totalBytes >= 100000) return 'advanced';
  if (projectCount >= 2 || totalBytes >= 20000) return 'intermediate';
  return 'beginner';
}

// =====================================================
// WEAKNESS DETECTION
// =====================================================

export function detectWeaknesses(
  categoryScores: CategoryScores,
  detailedBreakdown: DetailedBreakdown
): Weakness[] {
  const weaknesses: Weakness[] = [];

  // Check each category for weaknesses
  Object.entries(categoryScores).forEach(([category, score]) => {
    if (score < 50) {
      const severity: Weakness['severity'] = score < 25 ? 'high' : score < 40 ? 'medium' : 'low';
      const breakdown = detailedBreakdown[category as keyof DetailedBreakdown];
      
      // Find the weakest metrics
      const weakMetrics = breakdown
        .filter(item => (item.score / item.maxScore) < 0.5)
        .sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore));

      weakMetrics.forEach(metric => {
        weaknesses.push({
          category: formatCategoryName(category),
          issue: `Low score in ${metric.metric}: ${metric.score}/${metric.maxScore}`,
          severity,
          recommendation: metric.suggestion || `Improve your ${metric.metric.toLowerCase()}`,
        });
      });
    }
  });

  return weaknesses.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

function formatCategoryName(category: string): string {
  return category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

// =====================================================
// IMPROVEMENT GENERATION
// =====================================================

export function generateImprovements(
  categoryScores: CategoryScores,
  detailedBreakdown: DetailedBreakdown
): Improvement[] {
  const improvements: Improvement[] = [];
  let priority = 1;

  // Sort categories by score (lowest first)
  const sortedCategories = Object.entries(categoryScores)
    .sort(([, a], [, b]) => a - b);

  sortedCategories.forEach(([category, score]) => {
    if (score < 80) {
      const breakdown = detailedBreakdown[category as keyof DetailedBreakdown];
      const improvableMetrics = breakdown
        .filter(item => item.suggestion)
        .sort((a, b) => (a.score / a.maxScore) - (b.score / b.maxScore));

      if (improvableMetrics.length > 0) {
        improvements.push({
          priority: priority++,
          title: `Improve ${formatCategoryName(category)}`,
          description: `Your ${formatCategoryName(category).toLowerCase()} score is ${score}/100. Focus on the following areas.`,
          estimatedImpact: score < 50 ? 'High impact on overall score' : 'Medium impact on overall score',
          actionItems: improvableMetrics.map(m => m.suggestion!).slice(0, 3),
        });
      }
    }
  });

  return improvements.slice(0, 5); // Return top 5 improvements
}

// =====================================================
// BADGE SYSTEM
// =====================================================

export function calculateBadges(
  categoryScores: CategoryScores,
  repos: GitHubRepository[],
  skills: ExtractedSkill[],
  totalStars: number,
  followers: number,
  allReposIncludingForks?: GitHubRepository[],
  hasProfileReadme?: boolean
): Badge[] {
  const badges: Badge[] = [];
  const now = new Date();
  const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0);

  // ==========================================
  // Open Source Contributor
  // Earned when user has forked repos (contributing to others' projects)
  // ==========================================
  const forkedRepos = allReposIncludingForks
    ? allReposIncludingForks.filter(r => r.fork)
    : [];
  if (forkedRepos.length > 0) {
    badges.push({
      id: 'open-source',
      name: 'Open Source Contributor',
      description: `Contributed to ${forkedRepos.length} open source project${forkedRepos.length > 1 ? 's' : ''}`,
      icon: '❤️',
      earnedAt: now,
      category: 'Community',
    });
  }

  // ==========================================
  // Polyglot - 5+ programming languages
  // ==========================================
  if (skills.filter(s => s.category === 'language').length >= 5) {
    badges.push({
      id: 'polyglot',
      name: 'Polyglot',
      description: 'Proficient in 5+ programming languages',
      icon: '🌐',
      earnedAt: now,
      category: 'Diversity',
    });
  }

  // ==========================================
  // Consistent Coder - regular activity (score >= 60)
  // ==========================================
  if (categoryScores.activity >= 60) {
    badges.push({
      id: 'consistent',
      name: 'Consistent Coder',
      description: 'Maintains regular coding activity',
      icon: '🔥',
      earnedAt: now,
      category: 'Activity',
    });
  }

  // ==========================================
  // Great Documenter - good documentation (score >= 70)
  // ==========================================
  if (categoryScores.documentation >= 70) {
    badges.push({
      id: 'documenter',
      name: 'Great Documenter',
      description: 'Well-documented repositories',
      icon: '📖',
      earnedAt: now,
      category: 'Documentation',
    });
  }

  // ==========================================
  // Popular Developer - 50+ stars
  // ==========================================
  if (totalStars >= 50) {
    badges.push({
      id: 'popular',
      name: 'Popular Developer',
      description: `Earned ${totalStars} stars across repositories`,
      icon: '🌟',
      earnedAt: now,
      category: 'Community',
    });
  }

  // ==========================================
  // Community Member - active engagement
  // ==========================================
  if (totalForks >= 5 || followers >= 10 || totalStars >= 20) {
    badges.push({
      id: 'community',
      name: 'Community Member',
      description: 'Active community engagement',
      icon: '👥',
      earnedAt: now,
      category: 'Community',
    });
  }

  // ==========================================
  // Professional Profile - complete profile
  // ==========================================
  if (categoryScores.professionalism >= 70 || hasProfileReadme) {
    badges.push({
      id: 'professional',
      name: 'Professional Profile',
      description: 'Complete and professional GitHub profile',
      icon: '🛡️',
      earnedAt: now,
      category: 'Professionalism',
    });
  }

  // ==========================================
  // Innovator - diverse projects (diversity >= 70)
  // ==========================================
  if (categoryScores.diversity >= 70) {
    badges.push({
      id: 'innovative',
      name: 'Innovator',
      description: 'Creates diverse and innovative projects',
      icon: '⚡',
      earnedAt: now,
      category: 'Diversity',
    });
  }

  // ==========================================
  // Mentor - educational/tutorial projects
  // ==========================================
  const educationalKeywords = ['tutorial', 'learning', 'education', 'course', 'guide', 'example', 'demo', 'starter', 'template', 'boilerplate', 'workshop', 'lesson'];
  const hasEducationalRepos = repos.some(r =>
    r.topics.some(t => educationalKeywords.includes(t.toLowerCase())) ||
    (r.description && educationalKeywords.some(kw => r.description!.toLowerCase().includes(kw)))
  );
  if (hasEducationalRepos || repos.length >= 30) {
    badges.push({
      id: 'mentor',
      name: 'Mentor',
      description: 'Helps others learn through projects',
      icon: '🏆',
      earnedAt: now,
      category: 'Community',
    });
  }

  // ==========================================
  // Code Quality Badges (tiered)
  // ==========================================
  if (categoryScores.codeQuality >= 90) {
    badges.push({
      id: 'code-master',
      name: 'Code Master',
      description: 'Achieved 90+ in code quality',
      icon: '🏆',
      earnedAt: now,
      category: 'Code Quality',
    });
  } else if (categoryScores.codeQuality >= 70) {
    badges.push({
      id: 'quality-coder',
      name: 'Quality Coder',
      description: 'Achieved 70+ in code quality',
      icon: '⭐',
      earnedAt: now,
      category: 'Code Quality',
    });
  }

  // ==========================================
  // Documentation Hero (high tier)
  // ==========================================
  if (categoryScores.documentation >= 90) {
    badges.push({
      id: 'documentation-hero',
      name: 'Documentation Hero',
      description: 'Achieved 90+ in documentation',
      icon: '📚',
      earnedAt: now,
      category: 'Documentation',
    });
  }

  // ==========================================
  // Active Contributor (high tier activity)
  // ==========================================
  if (categoryScores.activity >= 80) {
    badges.push({
      id: 'active-contributor',
      name: 'Active Contributor',
      description: 'Consistently active developer',
      icon: '🔥',
      earnedAt: now,
      category: 'Activity',
    });
  }

  // ==========================================
  // Star Collector - 100+ stars (high tier)
  // ==========================================
  if (totalStars >= 100) {
    badges.push({
      id: 'star-collector',
      name: 'Star Collector',
      description: 'Received 100+ stars',
      icon: '⭐',
      earnedAt: now,
      category: 'Community',
    });
  }

  // ==========================================
  // Influencer - 100+ followers
  // ==========================================
  if (followers >= 100) {
    badges.push({
      id: 'influencer',
      name: 'Influencer',
      description: '100+ followers',
      icon: '👥',
      earnedAt: now,
      category: 'Community',
    });
  }

  // ==========================================
  // Repository count badges (tiered)
  // ==========================================
  if (repos.length >= 50) {
    badges.push({
      id: 'prolific-creator',
      name: 'Prolific Creator',
      description: 'Created 50+ repositories',
      icon: '🚀',
      earnedAt: now,
      category: 'Professionalism',
    });
  } else if (repos.length >= 20) {
    badges.push({
      id: 'builder',
      name: 'Builder',
      description: 'Created 20+ repositories',
      icon: '🔨',
      earnedAt: now,
      category: 'Professionalism',
    });
  }

  // ==========================================
  // Overall Score Badges (tiered)
  // ==========================================
  const overallScore = Math.round(
    categoryScores.codeQuality * 0.25 +
    categoryScores.documentation * 0.20 +
    categoryScores.activity * 0.20 +
    categoryScores.diversity * 0.15 +
    categoryScores.community * 0.10 +
    categoryScores.professionalism * 0.10
  );

  if (overallScore >= 90) {
    badges.push({
      id: 'elite-developer',
      name: 'Elite Developer',
      description: 'Overall score of 90+',
      icon: '💎',
      earnedAt: now,
      category: 'Overall',
    });
  } else if (overallScore >= 75) {
    badges.push({
      id: 'skilled-developer',
      name: 'Skilled Developer',
      description: 'Overall score of 75+',
      icon: '🎯',
      earnedAt: now,
      category: 'Overall',
    });
  }

  return badges;
}

export default {
  calculateFullScore,
  extractSkills,
  detectWeaknesses,
  generateImprovements,
  calculateBadges,
  CATEGORY_WEIGHTS,
};
