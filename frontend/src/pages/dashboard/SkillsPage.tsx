import React, { useMemo } from 'react';
import { Brain, Code, Database, Cloud, Wrench, Palette } from 'lucide-react';
import { useAnalysisStore } from '../../store/analysisStore';
import { Card, CardHeader, Alert, ProgressBar } from '../../components/ui';
import { SkillPieChart } from '../../components/charts';

// Skill categories for organization
const skillCategories: Record<string, { icon: React.ElementType; skills: string[] }> = {
  Languages: {
    icon: Code,
    skills: [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C', 'C++',
      'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'C#', 'Shell', 'Bash',
    ],
  },
  'Web Frameworks': {
    icon: Palette,
    skills: [
      'React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt', 'Express',
      'FastAPI', 'Django', 'Flask', 'Rails', 'Spring', 'Laravel', 'ASP.NET',
    ],
  },
  Databases: {
    icon: Database,
    skills: [
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'SQLite', 'Cassandra',
      'DynamoDB', 'Firebase', 'Supabase', 'Prisma', 'GraphQL',
    ],
  },
  Cloud: {
    icon: Cloud,
    skills: [
      'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD',
      'GitHub Actions', 'Jenkins', 'Vercel', 'Netlify', 'Heroku',
    ],
  },
  Tools: {
    icon: Wrench,
    skills: [
      'Git', 'Linux', 'Vim', 'VS Code', 'Jest', 'Cypress', 'Webpack',
      'Vite', 'ESLint', 'Prettier', 'npm', 'yarn', 'pnpm',
    ],
  },
};

const SkillsPage: React.FC = () => {
  const { currentReport } = useAnalysisStore();

  const skills = currentReport?.result.skills || [];
  const repositories = currentReport?.result.repositories || [];

  // Calculate skill frequency from repositories
  const skillFrequency = useMemo(() => {
    const frequency: Record<string, number> = {};

    repositories.forEach((repo) => {
      if (repo.language) {
        frequency[repo.language] = (frequency[repo.language] || 0) + 1;
      }
      repo.topics?.forEach((topic) => {
        frequency[topic] = (frequency[topic] || 0) + 1;
      });
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [repositories]);

  // Categorize skills
  const categorizedSkills = useMemo(() => {
    const result: Record<string, string[]> = {};

    Object.entries(skillCategories).forEach(([category, { skills: categorySkills }]) => {
      const matched = skills.filter((skill) =>
        categorySkills.some(
          (cs) => cs.toLowerCase() === skill.toLowerCase()
        )
      );
      if (matched.length > 0) {
        result[category] = matched;
      }
    });

    // Add uncategorized skills
    const allCategorized = Object.values(result).flat();
    const uncategorized = skills.filter(
      (skill) => !allCategorized.includes(skill)
    );
    if (uncategorized.length > 0) {
      result['Other'] = uncategorized;
    }

    return result;
  }, [skills]);

  if (!currentReport) {
    return (
      <Alert variant="info" title="No Analysis Found">
        Run an analysis from the dashboard to see your skills.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Skills</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {skills.length} skills detected across your repositories
        </p>
      </div>

      {/* Skill Distribution Chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Language Distribution" />
          <SkillPieChart
            skills={skillFrequency.slice(0, 8)}
            height={300}
          />
        </Card>

        <Card>
          <CardHeader title="Top Languages by Usage" />
          <div className="space-y-4">
            {skillFrequency.slice(0, 8).map(({ name, value }) => (
              <ProgressBar
                key={name}
                value={value}
                max={Math.max(...skillFrequency.map((s) => s.value))}
                label={name}
                showValue={false}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Categorized Skills */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(categorizedSkills).map(([category, categorySkills]) => {
          const IconComponent = skillCategories[category]?.icon || Brain;
          return (
            <Card key={category}>
              <CardHeader
                title={category}
                icon={<IconComponent className="w-5 h-5 text-primary-600" />}
              />
              <div className="flex flex-wrap gap-2">
                {categorySkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* All Skills */}
      <Card>
        <CardHeader title="All Detected Skills" />
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SkillsPage;
