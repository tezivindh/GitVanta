import {
  generateContent,
  generateStructuredContent,
  isAIAvailable,
} from "../ai";
import {
  ReadmeEnhancement,
  ResumeBullet,
  PortfolioSummary,
  ImprovementRoadmap,
  GitHubRepository,
  ExtractedSkill,
} from "../types";
import logger from "../utils/logger";

export function isAiAvailable(): boolean {
  return isAIAvailable();
}

export async function enhanceReadme(
  repoName: string,
  currentReadme: string,
  repoDescription: string,
  languages: string[],
  topics: string[],
): Promise<ReadmeEnhancement> {
  const prompt = `You are a technical writing expert. Enhance the following README for a GitHub repository.

Repository: ${repoName}
Description: ${repoDescription || "No description provided"}
Languages: ${languages.join(", ") || "Not specified"}
Topics: ${topics.join(", ") || "None"}

Current README:
${currentReadme || "No README exists"}

Please provide an enhanced README that includes:
1. A clear and engaging title with badges
2. A concise but informative description
3. Features section with bullet points
4. Installation instructions
5. Usage examples with code snippets
6. Contributing guidelines section
7. License section placeholder

Return your response in this JSON format:
{
  "enhancedContent": "the full enhanced README in markdown",
  "suggestions": ["list of specific improvement suggestions"],
  "addedSections": ["list of sections that were added or improved"]
}`;

  try {
    const result = await generateStructuredContent<{
      enhancedContent: string;
      suggestions: string[];
      addedSections: string[];
    }>(prompt);

    return {
      originalContent: currentReadme,
      enhancedContent: result.enhancedContent,
      suggestions: result.suggestions,
      addedSections: result.addedSections,
    };
  } catch (error) {
    logger.error("Failed to enhance README:", error);
    throw new Error("Failed to enhance README with AI");
  }
}

export async function generateResumeBullets(
  repo: GitHubRepository,
  languages: Record<string, number>,
  readmeContent: string | null,
): Promise<ResumeBullet> {
  const languageList = Object.keys(languages).slice(0, 5);

  const prompt = `You are a professional resume writer specializing in tech resumes.

Generate impactful resume bullet points for this GitHub project:

Repository: ${repo.name}
Description: ${repo.description || "No description"}
Languages: ${languageList.join(", ")}
Stars: ${repo.stargazers_count}
Forks: ${repo.forks_count}
Topics: ${repo.topics.join(", ")}

${readmeContent ? `README excerpt: ${readmeContent.substring(0, 500)}` : ""}

Create 3-4 strong action-oriented bullet points that:
- Start with strong action verbs (Developed, Implemented, Architected, etc.)
- Include quantifiable metrics where possible
- Highlight technical achievements
- Are suitable for a professional tech resume

Return your response in this JSON format:
{
  "bullets": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "skills": ["skill1", "skill2", "skill3"],
  "impact": "one sentence describing overall impact"
}`;

  try {
    const result = await generateStructuredContent<{
      bullets: string[];
      skills: string[];
      impact: string;
    }>(prompt);

    return {
      repoName: repo.name,
      bullets: result.bullets,
      skills: result.skills,
      impact: result.impact,
    };
  } catch (error) {
    logger.error("Failed to generate resume bullets:", error);
    throw new Error("Failed to generate resume bullets with AI");
  }
}

export async function generatePortfolioSummary(
  username: string,
  repos: GitHubRepository[],
  skills: ExtractedSkill[],
  overallScore: number,
): Promise<PortfolioSummary> {
  const topSkills = skills.slice(0, 10).map((s) => s.name);
  const topRepos = repos
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5)
    .map((r) => ({
      name: r.name,
      description: r.description,
      stars: r.stargazers_count,
    }));

  const prompt = `You are a professional career consultant specializing in tech profiles.

Create a compelling portfolio summary for this developer:

Username: ${username}
Overall Score: ${overallScore}/100
Top Skills: ${topSkills.join(", ")}
Number of Repositories: ${repos.length}

Top Projects:
${topRepos.map((r) => `- ${r.name}: ${r.description || "No description"} (${r.stars} stars)`).join("\n")}

Generate a professional portfolio summary that includes:
1. A catchy headline (e.g., "Full-Stack Developer | Open Source Contributor")
2. A 2-3 sentence professional summary
3. Key highlights (3-4 bullet points)
4. Technical skills (categorized)
5. Soft skills demonstrated through their work

Return your response in this JSON format:
{
  "headline": "professional headline",
  "summary": "2-3 sentence professional summary",
  "highlights": ["highlight 1", "highlight 2", "highlight 3"],
  "technicalSkills": ["skill1", "skill2", "skill3"],
  "softSkills": ["soft skill 1", "soft skill 2"]
}`;

  try {
    const result = await generateStructuredContent<{
      headline: string;
      summary: string;
      highlights: string[];
      technicalSkills: string[];
      softSkills: string[];
    }>(prompt);

    return {
      headline: result.headline,
      summary: result.summary,
      highlights: result.highlights,
      technicalSkills: result.technicalSkills,
      softSkills: result.softSkills,
    };
  } catch (error) {
    logger.error("Failed to generate portfolio summary:", error);
    throw new Error("Failed to generate portfolio summary with AI");
  }
}

export async function generateImprovementRoadmap(
  username: string,
  currentScore: number,
  skills: ExtractedSkill[],
  weaknesses: string[],
  repos: GitHubRepository[],
): Promise<ImprovementRoadmap> {
  const prompt = `You are a senior software engineering mentor.

Create a detailed improvement roadmap for this developer:

Username: ${username}
Current Score: ${currentScore}/100
Current Skills: ${skills
    .slice(0, 10)
    .map((s) => `${s.name} (${s.proficiency})`)
    .join(", ")}
Identified Weaknesses: ${weaknesses.join(", ")}
Number of Repositories: ${repos.length}

Create a structured improvement plan with:
1. Short-term goals (1-2 weeks) - quick wins
2. Medium-term goals (1-2 months) - skill building
3. Long-term goals (3-6 months) - career advancement

For each goal, include:
- Title
- Description
- Priority (high/medium/low)
- Estimated time
- Resources (links or tools)

Return your response in this JSON format:
{
  "shortTerm": [
    {"title": "goal", "description": "description", "priority": "high", "estimatedTime": "2 days", "resources": ["resource1"]}
  ],
  "mediumTerm": [
    {"title": "goal", "description": "description", "priority": "medium", "estimatedTime": "2 weeks", "resources": ["resource1"]}
  ],
  "longTerm": [
    {"title": "goal", "description": "description", "priority": "medium", "estimatedTime": "1 month", "resources": ["resource1"]}
  ]
}`;

  try {
    const result = await generateStructuredContent<ImprovementRoadmap>(prompt);
    return result;
  } catch (error) {
    logger.error("Failed to generate improvement roadmap:", error);
    throw new Error("Failed to generate improvement roadmap with AI");
  }
}

export async function analyzeReadmeQuality(readmeContent: string): Promise<{
  score: number;
  feedback: string[];
  missingElements: string[];
}> {
  if (!readmeContent) {
    return {
      score: 0,
      feedback: ["No README file found"],
      missingElements: ["README file"],
    };
  }

  const prompt = `Analyze this README file and provide quality feedback:

${readmeContent.substring(0, 3000)}

Evaluate based on:
1. Clarity and readability
2. Completeness of information
3. Code examples presence
4. Installation instructions
5. Usage documentation
6. Professional formatting

Return your response in this JSON format:
{
  "score": 75,
  "feedback": ["positive feedback 1", "area for improvement 1"],
  "missingElements": ["element that should be added"]
}`;

  try {
    const result = await generateStructuredContent<{
      score: number;
      feedback: string[];
      missingElements: string[];
    }>(prompt);
    return result;
  } catch (error) {
    logger.error("Failed to analyze README:", error);
    // Return basic analysis on failure
    const score = calculateBasicReadmeScore(readmeContent);
    return {
      score,
      feedback: ["Basic analysis performed"],
      missingElements: [],
    };
  }
}

function calculateBasicReadmeScore(content: string): number {
  let score = 0;

  if (content.length > 100) score += 10;
  if (content.length > 500) score += 15;
  if (content.length > 1000) score += 10;
  if (content.includes("#")) score += 10; // Has headers
  if (content.includes("```")) score += 15; // Has code blocks
  if (content.includes("install")) score += 10; // Has installation info
  if (content.includes("usage") || content.includes("example")) score += 10;
  if (content.includes("license") || content.includes("License")) score += 10;
  if (content.includes("contributing") || content.includes("Contributing"))
    score += 10;

  return Math.min(100, score);
}

export async function generateProjectDescription(
  repoName: string,
  languages: string[],
  topics: string[],
  currentDescription: string | null,
): Promise<string> {
  const prompt = `Generate a concise, professional GitHub repository description (max 160 characters).

Repository: ${repoName}
Languages: ${languages.join(", ")}
Topics: ${topics.join(", ")}
Current Description: ${currentDescription || "None"}

The description should:
- Be clear and informative
- Highlight the main purpose
- Include key technologies if space allows
- Be engaging but professional

Return ONLY the description text, no JSON or formatting.`;

  try {
    const description = await generateContent(prompt);
    return description.trim().substring(0, 160);
  } catch (error) {
    logger.error("Failed to generate project description:", error);
    throw new Error("Failed to generate project description with AI");
  }
}

export default {
  isAiAvailable,
  enhanceReadme,
  generateResumeBullets,
  generatePortfolioSummary,
  generateImprovementRoadmap,
  analyzeReadmeQuality,
  generateProjectDescription,
};
