import PDFDocument from 'pdfkit';
import { CategoryScores, ExtractedSkill, Badge, Weakness, Improvement } from '../types';

interface PDFExportData {
  username: string;
  displayName: string;
  avatarUrl: string;
  overallScore: number;
  categoryScores: CategoryScores;
  skills: ExtractedSkill[];
  badges: Badge[];
  weaknesses: Weakness[];
  improvements: Improvement[];
  generatedAt: Date;
}

export async function generatePDFReport(data: PDFExportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const safeData: PDFExportData = {
        username: data.username || 'Unknown',
        displayName: data.displayName || data.username || 'Unknown',
        avatarUrl: data.avatarUrl || '',
        overallScore: data.overallScore || 0,
        categoryScores: data.categoryScores || {
          codeQuality: 0,
          documentation: 0,
          activity: 0,
          diversity: 0,
          community: 0,
          professionalism: 0,
        },
        skills: data.skills || [],
        badges: data.badges || [],
        weaknesses: data.weaknesses || [],
        improvements: data.improvements || [],
        generatedAt: data.generatedAt || new Date(),
      };

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
        info: {
          Title: `GitHub Portfolio Report - ${safeData.username}`,
          Author: 'GitHub Portfolio Analyzer',
          Subject: 'Portfolio Analysis Report',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      drawHeader(doc, safeData);

      drawOverallScore(doc, safeData.overallScore);

      drawCategoryScores(doc, safeData.categoryScores);

      doc.addPage();
      drawSkills(doc, safeData.skills);

      drawBadges(doc, safeData.badges);

      doc.addPage();
      drawWeaknesses(doc, safeData.weaknesses);
      drawImprovements(doc, safeData.improvements);

      drawFooter(doc, safeData.generatedAt);

      doc.flushPages();
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function drawHeader(doc: PDFKit.PDFDocument, data: PDFExportData): void {
  // Title
  doc
    .fontSize(24)
    .fillColor('#1a1a2e')
    .text('GitHub Portfolio Analysis Report', { align: 'center' });

  doc.moveDown();

  // User info
  doc
    .fontSize(18)
    .fillColor('#16213e')
    .text(data.displayName || data.username, { align: 'center' });

  doc
    .fontSize(12)
    .fillColor('#666')
    .text(`@${data.username}`, { align: 'center' });

  doc.moveDown(2);

  // Divider
  drawDivider(doc);
}

function drawOverallScore(doc: PDFKit.PDFDocument, score: number): void {
  doc.moveDown();

  doc
    .fontSize(16)
    .fillColor('#1a1a2e')
    .text('Overall Portfolio Score', { align: 'center' });

  doc.moveDown(0.5);

  // Score circle representation
  const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444';
  
  doc
    .fontSize(48)
    .fillColor(scoreColor)
    .text(`${score}`, { align: 'center' });

  doc
    .fontSize(14)
    .fillColor('#666')
    .text('out of 100', { align: 'center' });

  doc.moveDown(2);
  drawDivider(doc);
}

function drawCategoryScores(doc: PDFKit.PDFDocument, scores: CategoryScores): void {
  doc.moveDown();

  doc
    .fontSize(16)
    .fillColor('#1a1a2e')
    .text('Category Breakdown', { align: 'left' });

  doc.moveDown();

  const categories = [
    { name: 'Code Quality', score: scores.codeQuality, weight: '25%' },
    { name: 'Documentation', score: scores.documentation, weight: '20%' },
    { name: 'Activity', score: scores.activity, weight: '20%' },
    { name: 'Diversity', score: scores.diversity, weight: '15%' },
    { name: 'Community', score: scores.community, weight: '10%' },
    { name: 'Professionalism', score: scores.professionalism, weight: '10%' },
  ];

  categories.forEach(cat => {
    const barWidth = 300;
    const barHeight = 15;
    const x = 50;
    const y = doc.y;

    // Category name
    doc
      .fontSize(11)
      .fillColor('#333')
      .text(`${cat.name} (${cat.weight})`, x, y);

    // Background bar
    doc
      .rect(x + 150, y, barWidth, barHeight)
      .fill('#e5e7eb');

    // Score bar
    const scoreWidth = (cat.score / 100) * barWidth;
    const color = cat.score >= 80 ? '#22c55e' : cat.score >= 60 ? '#eab308' : cat.score >= 40 ? '#f97316' : '#ef4444';
    doc
      .rect(x + 150, y, scoreWidth, barHeight)
      .fill(color);

    // Score text
    doc
      .fontSize(10)
      .fillColor('#333')
      .text(`${cat.score}`, x + 150 + barWidth + 10, y + 2);

    doc.moveDown(0.8);
  });
}

function drawSkills(doc: PDFKit.PDFDocument, skills: ExtractedSkill[]): void {
  doc
    .fontSize(16)
    .fillColor('#1a1a2e')
    .text('Technical Skills', { align: 'left' });

  doc.moveDown();

  if (!skills || skills.length === 0) {
    doc
      .fontSize(11)
      .fillColor('#666')
      .text('No skills detected yet. Run a portfolio analysis to detect your skills.');
    doc.moveDown();
    drawDivider(doc);
    return;
  }

  // Group skills by category
  const grouped: Record<string, ExtractedSkill[]> = {};
  skills.forEach(skill => {
    if (!grouped[skill.category]) {
      grouped[skill.category] = [];
    }
    grouped[skill.category].push(skill);
  });

  Object.entries(grouped).forEach(([category, categorySkills]) => {
    doc
      .fontSize(12)
      .fillColor('#16213e')
      .text(formatCategory(category), { underline: true });

    doc.moveDown(0.3);

    const skillsText = categorySkills
      .slice(0, 8)
      .map(s => `${s.name} (${s.proficiency})`)
      .join(', ');

    doc
      .fontSize(10)
      .fillColor('#666')
      .text(skillsText, { indent: 20 });

    doc.moveDown(0.5);
  });

  doc.moveDown();
  drawDivider(doc);
}

function drawBadges(doc: PDFKit.PDFDocument, badges: Badge[]): void {
  doc.moveDown();

  doc
    .fontSize(16)
    .fillColor('#1a1a2e')
    .text('Earned Badges', { align: 'left' });

  doc.moveDown();

  // Map badge ids to clean text labels since PDFKit can't render emoji
  const badgeLabels: Record<string, string> = {
    'open-source': '[OSS]',
    'polyglot': '[POLY]',
    'consistent': '[ACT]',
    'documenter': '[DOC]',
    'popular': '[STAR]',
    'community': '[COMM]',
    'professional': '[PRO]',
    'innovative': '[DIV]',
    'mentor': '[MENTOR]',
    'code-master': '[CM]',
    'quality-coder': '[QC]',
    'documentation-hero': '[DH]',
    'active-contributor': '[AC]',
    'star-collector': '[SC]',
    'influencer': '[INF]',
    'prolific-creator': '[PC]',
    'builder': '[BUILD]',
    'elite-developer': '[ELITE]',
    'skilled-developer': '[SKILL]',
  };

  if (badges.length === 0) {
    doc
      .fontSize(11)
      .fillColor('#666')
      .text('No badges earned yet. Keep improving your portfolio!');
  } else {
    badges.forEach(badge => {
      const label = badgeLabels[badge.id] || '[*]';
      doc
        .fontSize(11)
        .fillColor('#4f46e5')
        .text(label, { continued: true })
        .fillColor('#333')
        .text(` ${badge.name}`, { continued: true })
        .fontSize(10)
        .fillColor('#666')
        .text(` - ${badge.description}`);

      doc.moveDown(0.3);
    });
  }
}

function drawWeaknesses(doc: PDFKit.PDFDocument, weaknesses: Weakness[]): void {
  doc
    .fontSize(16)
    .fillColor('#1a1a2e')
    .text('Areas for Improvement', { align: 'left' });

  doc.moveDown();

  if (weaknesses.length === 0) {
    doc
      .fontSize(11)
      .fillColor('#22c55e')
      .text('Great job! No significant weaknesses detected.');
  } else {
    weaknesses.slice(0, 5).forEach((weakness, index) => {
      const severityColor = weakness.severity === 'high' ? '#ef4444' : 
                           weakness.severity === 'medium' ? '#f97316' : '#eab308';

      doc
        .fontSize(11)
        .fillColor(severityColor)
        .text(`${index + 1}. [${weakness.severity.toUpperCase()}] `, { continued: true })
        .fillColor('#333')
        .text(weakness.issue);

      doc
        .fontSize(10)
        .fillColor('#666')
        .text(`   Recommendation: ${weakness.recommendation}`, { indent: 20 });

      doc.moveDown(0.5);
    });
  }

  doc.moveDown();
  drawDivider(doc);
}

function drawImprovements(doc: PDFKit.PDFDocument, improvements: Improvement[]): void {
  doc.moveDown();

  doc
    .fontSize(16)
    .fillColor('#1a1a2e')
    .text('Improvement Roadmap', { align: 'left' });

  doc.moveDown();

  if (!improvements || improvements.length === 0) {
    doc
      .fontSize(11)
      .fillColor('#666')
      .text('No specific improvements suggested at this time.');
    return;
  }

  improvements.slice(0, 5).forEach((improvement, index) => {
    doc
      .fontSize(12)
      .fillColor('#16213e')
      .text(`${index + 1}. ${improvement.title}`);

    doc
      .fontSize(10)
      .fillColor('#666')
      .text(improvement.description, { indent: 20 });

    if (improvement.actionItems.length > 0) {
      doc
        .fontSize(10)
        .fillColor('#333')
        .text('Action Items:', { indent: 20 });

      improvement.actionItems.forEach(item => {
        doc
          .fontSize(9)
          .fillColor('#666')
          .text(`• ${item}`, { indent: 35 });
      });
    }

    doc.moveDown(0.5);
  });
}

function drawFooter(doc: PDFKit.PDFDocument, generatedAt: Date): void {
  const pageCount = doc.bufferedPageRange().count;

  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);

    // Footer
    doc
      .fontSize(8)
      .fillColor('#999')
      .text(
        `Generated by GitHub Portfolio Analyzer on ${generatedAt.toLocaleDateString()} | Page ${i + 1} of ${pageCount}`,
        50,
        doc.page.height - 65,
        { align: 'center' }
      );
  }
}

function drawDivider(doc: PDFKit.PDFDocument): void {
  const y = doc.y;
  doc
    .strokeColor('#e5e7eb')
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(doc.page.width - 50, y)
    .stroke();
}

function formatCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export default {
  generatePDFReport,
};
