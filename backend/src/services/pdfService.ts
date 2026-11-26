import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import {
  CategoryScores,
  ExtractedSkill,
  Badge,
  Weakness,
  Improvement,
  DetailedBreakdown,
  BreakdownItem,
  AnalyzedRepository,
} from '../types';

/**
 * The GitVanta PDF report, set in the app's Console system for print:
 * Host Grotesk for what a person reads, Atkinson Hyperlegible Mono for what
 * was measured, amber for the person, cool blue for measurements, green and
 * red only for gains and problems. Every figure comes from the analysis.
 */

interface ReportQuickWin {
  repo: string;
  isPrivate: boolean;
  title: string;
  detail: string;
  category: keyof CategoryScores;
  gain: number;
}

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
  /** Optional extras: the report is still complete without them. */
  detailedBreakdown?: DetailedBreakdown | null;
  quickWins?: { items: ReportQuickWin[]; totalGain: number } | null;
  repositories?: AnalyzedRepository[];
  previousScore?: number | null;
  analysisCount?: number;
}

// ---------------------------------------------------------------------------
// System
// ---------------------------------------------------------------------------

const C = {
  page: '#FFFFFF',
  panel: '#F4F6F8',
  deep: '#ECEFF3',
  ink: '#1C1F24',
  ink2: '#3A3F47',
  muted: '#5E6570',
  rule: '#DFE3E8',
  rule2: '#C3C9D1',
  accent: '#8C5A00',
  accentSoft: '#FBF0DC',
  cool: '#1F5FAE',
  coolSoft: '#E6EEF8',
  track: '#E4E8EE',
  ok: '#1B7A3E',
  okSoft: '#E5F3EA',
  bad: '#B3261E',
  badSoft: '#FBE9E7',
  heat: ['#E4E8EE', '#BFD1E8', '#8CB0DA', '#4F86C6', '#1F5FAE'],
};

const PAGE = { w: 595.28, h: 841.89 };
const M = { x: 52, top: 56, bottom: 64 };
const W = PAGE.w - M.x * 2;

const CATEGORIES: Array<{ key: keyof CategoryScores; label: string; short: string; weight: number; about: string }> = [
  { key: 'codeQuality', label: 'Code quality', short: 'Code quality', weight: 0.25, about: 'Tests, licences, structure and how maintainable the repos look.' },
  { key: 'documentation', label: 'Documentation', short: 'Documentation', weight: 0.2, about: 'READMEs, their depth, licences and contributing guides.' },
  { key: 'activity', label: 'Activity', short: 'Activity', weight: 0.2, about: 'Recent pushes, consistency and how many repos are maintained.' },
  { key: 'diversity', label: 'Diversity', short: 'Diversity', weight: 0.15, about: 'Languages, topics and the kinds of projects you build.' },
  { key: 'community', label: 'Community', short: 'Community', weight: 0.1, about: 'Stars, forks and followers.' },
  { key: 'professionalism', label: 'Professionalism', short: 'Profile', weight: 0.1, about: 'Bio, website, profile README and linked accounts.' },
];

const FONT_DIR = path.resolve(__dirname, '../../assets/fonts');
const FONT_FILES = {
  body: 'host-grotesk-latin-400-normal.woff',
  bodyM: 'host-grotesk-latin-500-normal.woff',
  mono: 'atkinson-hyperlegible-mono-latin-400-normal.woff',
  monoM: 'atkinson-hyperlegible-mono-latin-500-normal.woff',
};
const FALLBACK = { body: 'Helvetica', bodyM: 'Helvetica-Bold', mono: 'Courier', monoM: 'Courier-Bold' };
type Face = keyof typeof FONT_FILES;

function registerFonts(doc: PDFKit.PDFDocument): Record<Face, string> {
  const faces = {} as Record<Face, string>;
  (Object.keys(FONT_FILES) as Face[]).forEach((face) => {
    const file = path.join(FONT_DIR, FONT_FILES[face]);
    if (fs.existsSync(file)) {
      doc.registerFont(face, file);
      faces[face] = face;
    } else {
      faces[face] = FALLBACK[face];
    }
  });
  return faces;
}

// ---------------------------------------------------------------------------
// Copy helpers (all derived from the data, never invented)
// ---------------------------------------------------------------------------

const round1 = (n: number) => Math.round(n * 10) / 10;
const fmt1 = (n: number) => (Number.isInteger(round1(n)) ? String(round1(n)) : round1(n).toFixed(1));
const clean = (s: unknown) => (typeof s === 'string' ? s.trim() : '');
const sentenceCase = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function verdict(score: number): { head: string; line: string } {
  if (score >= 85) return { head: 'An outstanding portfolio', line: 'It reads as the work of someone who ships, documents and maintains.' };
  if (score >= 70) return { head: 'A strong portfolio', line: 'A reviewer will find well kept work; a few fixes would make it stand out.' };
  if (score >= 55) return { head: 'A solid portfolio with clear gains', line: 'The foundations are there. The fixes below are the fastest way up.' };
  if (score >= 40) return { head: 'A portfolio with room to grow', line: 'Small, specific fixes across a few repos will move this score quickly.' };
  return { head: 'An early-stage portfolio', line: 'Start with the fixes below: each one is worth real points.' };
}

const SKILL_LEVEL: Record<ExtractedSkill['proficiency'], number> = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
const SKILL_GROUP: Record<ExtractedSkill['category'], string> = {
  language: 'Languages',
  framework: 'Frameworks',
  tool: 'Tools',
  database: 'Databases',
  cloud: 'Cloud',
  other: 'Other',
};

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

export async function generatePDFReport(input: PDFExportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const data: PDFExportData = {
        ...input,
        username: input.username || 'unknown',
        displayName: input.displayName || input.username || 'Unknown',
        overallScore: Math.round(input.overallScore || 0),
        categoryScores: input.categoryScores || {
          codeQuality: 0, documentation: 0, activity: 0, diversity: 0, community: 0, professionalism: 0,
        },
        skills: input.skills || [],
        badges: input.badges || [],
        weaknesses: input.weaknesses || [],
        improvements: input.improvements || [],
        generatedAt: input.generatedAt ? new Date(input.generatedAt) : new Date(),
        repositories: input.repositories || [],
      };

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: M.top, bottom: 0, left: M.x, right: M.x },
        bufferPages: true,
        info: {
          Title: `GitVanta portfolio report for @${data.username}`,
          Author: 'GitVanta',
          Subject: `GitHub portfolio score: ${data.overallScore} out of 100`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const r = new Renderer(doc, registerFonts(doc));
      r.summary(data);
      r.fixes(data);
      r.metrics(data);
      r.skillsAndBadges(data);
      r.repositories(data);
      r.method();
      r.footers(data);

      doc.flushPages();
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

class Renderer {
  y = M.top;
  constructor(private doc: PDFKit.PDFDocument, private f: Record<Face, string>) {}

  // --- primitives -----------------------------------------------------------

  private get limit() {
    return PAGE.h - M.bottom;
  }

  private newPage() {
    this.doc.addPage();
    this.y = M.top;
  }

  /** Start a new page unless `h` points still fit. */
  private ensure(h: number) {
    if (this.y + h > this.limit) this.newPage();
  }

  private set(face: Face, size: number, color: string) {
    this.doc.font(this.f[face]).fontSize(size).fillColor(color);
    return this.doc;
  }

  private height(text: string, face: Face, size: number, width: number, lineGap = 2) {
    this.doc.font(this.f[face]).fontSize(size);
    return this.doc.heightOfString(text, { width, lineGap });
  }

  private width(text: string, face: Face, size: number) {
    this.doc.font(this.f[face]).fontSize(size);
    return this.doc.widthOfString(text);
  }

  private text(text: string, x: number, y: number, face: Face, size: number, color: string, opts: PDFKit.Mixins.TextOptions = {}) {
    this.set(face, size, color).text(text, x, y, { lineGap: 2, ...opts });
  }

  private hair(y: number, x = M.x, w = W, color = C.rule) {
    this.doc.save().moveTo(x, y).lineTo(x + w, y).lineWidth(0.75).strokeColor(color).stroke().restore();
  }

  private box(x: number, y: number, w: number, h: number, fill: string, stroke?: string, radius = 6) {
    this.doc.save().roundedRect(x, y, w, h, radius);
    if (stroke) this.doc.lineWidth(0.75).fillAndStroke(fill, stroke);
    else this.doc.fill(fill);
    this.doc.restore();
  }

  private bar(x: number, y: number, w: number, h: number, pct: number, color = C.cool) {
    this.box(x, y, w, h, C.track, undefined, h / 2);
    const fill = Math.max(0, Math.min(1, pct)) * w;
    if (fill > 0) this.box(x, y, Math.max(fill, h), h, color, undefined, h / 2);
  }

  private chip(label: string, x: number, y: number, fill: string, color: string) {
    const w = this.width(label, 'bodyM', 8) + 12;
    this.box(x, y, w, 15, fill, undefined, 3);
    this.text(label, x + 6, y + 3.6, 'bodyM', 8, color, { lineBreak: false });
    return w;
  }

  /** A section opens with its head and one line; returns nothing, advances y. */
  private section(head: string, line?: string, keepWith = 120) {
    const lineH = line ? this.height(line, 'body', 10.5, W * 0.72) : 0;
    this.ensure(26 + lineH + keepWith);
    if (this.y > M.top + 4) this.y += 14;
    this.text(head, M.x, this.y, 'bodyM', 19, C.ink, { characterSpacing: -0.3 });
    this.y += 27;
    if (line) {
      this.text(line, M.x, this.y, 'body', 10.5, C.muted, { width: W * 0.72 });
      this.y += lineH + 4;
    }
    this.y += 12;
  }

  private logo(x: number, y: number, size = 14) {
    const cells: Array<[number, number, number]> = [
      [0, 0, 0], [1, 0, 0], [2, 0, 4],
      [0, 1, 0], [1, 1, 3], [2, 1, 4],
      [0, 2, 2], [1, 2, 3], [2, 2, 4],
    ];
    const s = size / 3.2;
    cells.forEach(([c, r, l]) => this.box(x + c * s * 1.1, y + r * s * 1.1, s, s, C.heat[l], undefined, 0.8));
  }

  // --- page 1: the summary -------------------------------------------------

  summary(d: PDFExportData) {
    // Masthead
    this.logo(M.x, this.y + 1, 15);
    this.text('GitVanta', M.x + 22, this.y, 'bodyM', 12, C.ink);
    const date = formatDate(d.generatedAt);
    this.text('Portfolio report', M.x, this.y + 1.5, 'body', 9, C.muted, { width: W - this.width(date, 'mono', 9) - 10, align: 'right' });
    this.text(date, PAGE.w - M.x - this.width(date, 'mono', 9), this.y + 1.5, 'mono', 9, C.ink2, { lineBreak: false });
    this.y += 26;
    this.hair(this.y);
    this.y += 30;

    // Who
    this.text(d.displayName, M.x, this.y, 'bodyM', 30, C.ink, { width: W, characterSpacing: -0.6 });
    this.y += this.height(d.displayName, 'bodyM', 30, W) + 2;
    this.text(`@${d.username}`, M.x, this.y, 'mono', 11, C.muted);
    this.y += 30;

    // The reading
    const panelH = 168;
    this.box(M.x, this.y, W, panelH, C.panel, C.rule, 8);
    const px = M.x + 24;
    const py = this.y + 22;
    this.text('Overall score', px, py, 'body', 9.5, C.muted);
    const score = String(d.overallScore);
    this.text(score, px - 3, py + 14, 'mono', 76, C.ink, { lineBreak: false, characterSpacing: -3 });
    const sw = this.width(score, 'mono', 76) - 3 * score.length;
    this.text('/100', px + sw + 4, py + 66, 'mono', 16, C.muted, { lineBreak: false });

    // Change since the previous analysis, as a diff
    const cy = py + 112;
    if (typeof d.previousScore === 'number') {
      const prev = String(Math.round(d.previousScore));
      const diff = d.overallScore - Math.round(d.previousScore);
      this.text(prev, px, cy, 'mono', 11, C.muted, { lineBreak: false });
      const pw = this.width(prev, 'mono', 11);
      this.doc.save().moveTo(px - 1, cy + 6.5).lineTo(px + pw + 1, cy + 6.5).lineWidth(0.9).strokeColor(C.muted).stroke().restore();
      const label = diff > 0 ? `+${diff}` : diff < 0 ? `−${Math.abs(diff)}` : '0';
      const tone = diff > 0 ? [C.okSoft, C.ok] : diff < 0 ? [C.badSoft, C.bad] : [C.deep, C.muted];
      const lw = this.width(label, 'monoM', 10.5) + 10;
      this.box(px + pw + 8, cy - 2.5, lw, 16, tone[0], undefined, 3);
      this.text(label, px + pw + 13, cy + 0.5, 'monoM', 10.5, tone[1], { lineBreak: false });
      this.text('since your last analysis', px + pw + lw + 16, cy + 1, 'body', 9.5, C.muted, { lineBreak: false });
    } else {
      this.text('Your first analysis', px, cy + 1, 'body', 9.5, C.muted, { lineBreak: false });
    }

    // Verdict, built from the data
    const vx = M.x + W * 0.5;
    const vw = W * 0.5 - 24;
    const v = verdict(d.overallScore);
    const ranked = CATEGORIES.map((c) => ({ ...c, score: Math.round(d.categoryScores[c.key] || 0) }));
    const best = [...ranked].sort((a, b) => b.score - a.score)[0];
    const costliest = [...ranked].sort((a, b) => (100 - b.score) * b.weight - (100 - a.score) * a.weight)[0];
    let vy = py;
    this.text(v.head, vx, vy, 'bodyM', 14, C.ink, { width: vw });
    vy += this.height(v.head, 'bodyM', 14, vw) + 6;
    this.text(v.line, vx, vy, 'body', 10, C.ink2, { width: vw });
    vy += this.height(v.line, 'body', 10, vw) + 10;
    const facts = [
      `Strongest: ${best.label}, ${best.score}.`,
      `Costs you most: ${costliest.label}, ${costliest.score} (${fmt1((100 - costliest.score) * costliest.weight)} points left on the table).`,
    ];
    const wins = d.quickWins?.items?.length ? d.quickWins : null;
    if (wins && wins.totalGain > 0) {
      facts.push(`The ${wins.items.length === 1 ? 'top fix is' : `top ${wins.items.length} fixes are`} worth +${fmt1(wins.totalGain)} points.`);
    }
    facts.forEach((t) => {
      this.box(vx, vy + 4.5, 3, 3, C.cool, undefined, 0.5);
      this.text(t, vx + 10, vy, 'body', 9.5, C.ink2, { width: vw - 10 });
      vy += this.height(t, 'body', 9.5, vw - 10) + 4;
    });
    this.y += panelH + 30;

    // The weighted bar: width is the weight, fill is the score
    this.text('Where the score comes from', M.x, this.y, 'bodyM', 13, C.ink);
    this.y += 20;
    this.text('Each segment is as wide as the category’s weight and filled to its score, so the filled area is your number.', M.x, this.y, 'body', 9.5, C.muted, { width: W });
    this.y += 22;
    const gap = 3;
    let sx = M.x;
    const usable = W - gap * (CATEGORIES.length - 1);
    ranked.forEach((c) => {
      const w = usable * c.weight;
      this.box(sx, this.y, w, 22, C.track, undefined, 3);
      const fw = (w * c.score) / 100;
      if (fw > 0) this.box(sx, this.y, Math.max(fw, 4), 22, C.cool, undefined, 3);
      this.text(String(c.score), sx, this.y + 30, 'monoM', 12, C.ink, { lineBreak: false });
      this.text(c.short, sx, this.y + 47, 'body', 8.5, C.ink2, { width: w - 2, lineBreak: false, ellipsis: true });
      this.text(`${Math.round(c.weight * 100)}%`, sx, this.y + 59, 'mono', 8, C.muted, { lineBreak: false });
      sx += w + gap;
    });
    this.y += 86;

    // Points table
    const cols = [
      { h: 'Category', x: M.x, w: 190, align: 'left' as const },
      { h: 'Weight', x: M.x + 190, w: 70, align: 'right' as const },
      { h: 'Score', x: M.x + 260, w: 70, align: 'right' as const },
      { h: 'Points earned', x: M.x + 330, w: 90, align: 'right' as const },
      { h: 'Possible', x: M.x + 420, w: W - 420, align: 'right' as const },
    ];
    this.hair(this.y, M.x, W, C.rule2);
    this.y += 8;
    cols.forEach((c) => this.text(c.h, c.x, this.y, 'body', 8.5, C.muted, { width: c.w, align: c.align }));
    this.y += 17;
    this.hair(this.y);
    let earned = 0;
    ranked.forEach((c) => {
      const pts = c.score * c.weight;
      earned += pts;
      const ry = this.y + 8;
      this.text(c.label, cols[0].x, ry, 'body', 10, C.ink, { width: cols[0].w });
      this.text(`${Math.round(c.weight * 100)}%`, cols[1].x, ry, 'mono', 10, C.ink2, { width: cols[1].w, align: 'right' });
      this.text(String(c.score), cols[2].x, ry, 'mono', 10, C.ink2, { width: cols[2].w, align: 'right' });
      this.text(fmt1(pts), cols[3].x, ry, 'monoM', 10, C.ink, { width: cols[3].w, align: 'right' });
      this.text(fmt1(c.weight * 100), cols[4].x, ry, 'mono', 10, C.muted, { width: cols[4].w, align: 'right' });
      this.y += 26;
      this.hair(this.y);
    });
    const ry = this.y + 9;
    this.text('Overall', cols[0].x, ry, 'bodyM', 10.5, C.ink, { width: cols[0].w });
    this.text(fmt1(earned), cols[3].x, ry, 'monoM', 10.5, C.ink, { width: cols[3].w, align: 'right' });
    this.text('100', cols[4].x, ry, 'mono', 10.5, C.muted, { width: cols[4].w, align: 'right' });
    this.y += 30;
    this.hair(this.y, M.x, W, C.rule2);
    this.y += 10;
  }

  // --- fixes, roadmap and watch list ----------------------------------------

  fixes(d: PDFExportData) {
    const wins = d.quickWins?.items?.filter((w) => w && w.gain > 0) || [];
    if (wins.length) {
      this.newPage();
      this.section('Fix these first', 'Each gain is measured, not estimated: GitVanta re-ran the scoring with the fix applied.', 60);
      wins.forEach((w) => {
        const title = clean(w.title);
        const detail = clean(w.detail);
        const tx = M.x + 66;
        const tw = W - 66 - 14;
        const repo = w.isPrivate ? `${w.repo} (private)` : w.repo;
        const h = Math.max(48, 14 + this.height(title, 'bodyM', 11, tw) + 15 + (detail ? this.height(detail, 'body', 9.5, tw) + 4 : 0) + 10);
        this.ensure(h + 4);
        this.box(M.x, this.y, W, h, C.page, C.rule, 6);
        this.box(M.x, this.y, 54, h, C.okSoft, undefined, 6);
        this.doc.save().rect(M.x + 48, this.y, 6, h).fill(C.okSoft).restore();
        this.text(`+${fmt1(w.gain)}`, M.x, this.y + h / 2 - 7, 'monoM', 13, C.ok, { width: 54, align: 'center' });
        let ty = this.y + 12;
        this.text(title, tx, ty, 'bodyM', 11, C.ink, { width: tw });
        ty += this.height(title, 'bodyM', 11, tw) + 2;
        this.text(repo, tx, ty, 'mono', 9.5, C.cool, { width: tw });
        ty += 14;
        if (detail) this.text(detail, tx, ty, 'body', 9.5, C.muted, { width: tw });
        this.y += h + 6;
      });
      const total = round1(d.quickWins?.totalGain || wins.reduce((s, w) => s + w.gain, 0));
      const to = Math.min(100, round1(d.overallScore + total));
      this.ensure(30);
      this.y += 6;
      this.text('Together', M.x, this.y, 'body', 10.5, C.muted, { lineBreak: false });
      const tw1 = this.width('Together', 'body', 10.5) + 8;
      this.text(`+${fmt1(total)}`, M.x + tw1, this.y - 0.5, 'monoM', 11, C.ok, { lineBreak: false });
      const tw2 = this.width(`+${fmt1(total)}`, 'monoM', 11) + 8;
      this.text('points, taking you from', M.x + tw1 + tw2, this.y, 'body', 10.5, C.muted, { lineBreak: false });
      const tw3 = this.width('points, taking you from', 'body', 10.5) + 8;
      this.text(`${d.overallScore} to ${fmt1(to)}.`, M.x + tw1 + tw2 + tw3, this.y - 0.5, 'monoM', 11, C.ink, { lineBreak: false });
      this.y += 26;
    } else {
      this.newPage();
    }

    // Roadmap
    const steps = d.improvements.slice(0, 5);
    if (steps.length) {
      this.section('Your roadmap', 'The bigger moves, in the order that pays off most.', 80);
      steps.forEach((s, i) => {
        const tx = M.x + 34;
        const tw = W - 34;
        const desc = clean(s.description);
        const items = (s.actionItems || []).map(clean).filter(Boolean).slice(0, 5);
        const impact = clean(s.estimatedImpact);
        let h = this.height(clean(s.title), 'bodyM', 11.5, tw - 110) + 6;
        if (desc) h += this.height(desc, 'body', 10, tw) + 6;
        items.forEach((it) => (h += this.height(it, 'body', 9.5, tw - 16) + 4));
        this.ensure(h + 18);
        this.box(M.x, this.y, 22, 22, C.accentSoft, undefined, 11);
        this.text(String(i + 1), M.x, this.y + 5.5, 'monoM', 10, C.accent, { width: 22, align: 'center' });
        let ty = this.y + 2;
        this.text(clean(s.title), tx, ty, 'bodyM', 11.5, C.ink, { width: tw - 110 });
        if (impact) {
          const cw = this.width(impact, 'bodyM', 8) + 12;
          this.chip(impact, PAGE.w - M.x - cw, ty, C.coolSoft, C.cool);
        }
        ty += this.height(clean(s.title), 'bodyM', 11.5, tw - 110) + 6;
        if (desc) {
          this.text(desc, tx, ty, 'body', 10, C.ink2, { width: tw });
          ty += this.height(desc, 'body', 10, tw) + 6;
        }
        items.forEach((it) => {
          this.doc.save().roundedRect(tx, ty + 2.5, 8, 8, 1.5).lineWidth(0.8).strokeColor(C.rule2).stroke().restore();
          this.text(it, tx + 16, ty, 'body', 9.5, C.ink2, { width: tw - 16 });
          ty += this.height(it, 'body', 9.5, tw - 16) + 4;
        });
        this.y = ty + 10;
        if (i < steps.length - 1) {
          this.hair(this.y - 2);
          this.y += 10;
        }
      });
    }

    // Watch list
    const watch = d.weaknesses.slice(0, 6);
    if (watch.length) {
      this.section('Watch list', 'What a reviewer is most likely to notice, and what to do about it.', 70);
      const sev: Record<string, [string, string, string]> = {
        high: ['High', C.badSoft, C.bad],
        medium: ['Medium', C.accentSoft, C.accent],
        low: ['Low', C.deep, C.muted],
      };
      watch.forEach((w) => {
        const tw = W - 80;
        const issue = clean(w.issue);
        const rec = clean(w.recommendation);
        const h = this.height(issue, 'bodyM', 10.5, tw) + (rec ? this.height(rec, 'body', 9.5, tw) + 4 : 0) + 18;
        this.ensure(h);
        const [label, bg, fg] = sev[w.severity] || sev.low;
        this.chip(label, M.x, this.y + 1, bg, fg);
        this.text(issue, M.x + 80, this.y, 'bodyM', 10.5, C.ink, { width: tw });
        let ty = this.y + this.height(issue, 'bodyM', 10.5, tw) + 3;
        if (rec) {
          this.text(rec, M.x + 80, ty, 'body', 9.5, C.muted, { width: tw });
          ty += this.height(rec, 'body', 9.5, tw);
        }
        this.y = ty + 12;
        this.hair(this.y - 6);
      });
    }
  }

  // --- every metric ---------------------------------------------------------

  metrics(d: PDFExportData) {
    const bd = d.detailedBreakdown;
    if (!bd) return;
    const any = CATEGORIES.some((c) => (bd[c.key] || []).length);
    if (!any) return;
    this.section('Every metric', 'What each category measured in your repositories, and the next step where there is one.', 100);
    CATEGORIES.forEach((c) => {
      const items: BreakdownItem[] = bd[c.key] || [];
      if (!items.length) return;
      const score = Math.round(d.categoryScores[c.key] || 0);
      this.ensure(56 + Math.min(items.length, 2) * 40);
      // Category head
      this.text(c.label, M.x, this.y, 'bodyM', 13, C.ink, { lineBreak: false });
      const sTxt = `${score}/100`;
      this.text(sTxt, PAGE.w - M.x - this.width(sTxt, 'monoM', 12), this.y + 1, 'monoM', 12, C.ink, { lineBreak: false });
      const wTxt = `${Math.round(c.weight * 100)}% of the score`;
      this.text(wTxt, PAGE.w - M.x - this.width(sTxt, 'monoM', 12) - this.width(wTxt, 'body', 9) - 12, this.y + 3, 'body', 9, C.muted, { lineBreak: false });
      this.y += 19;
      this.text(c.about, M.x, this.y, 'body', 9.5, C.muted, { width: W });
      this.y += 18;
      this.hair(this.y, M.x, W, C.rule2);
      items.forEach((it) => {
        const nameW = 150;
        const descX = M.x + nameW + 10;
        const descW = W - nameW - 10 - 110;
        const desc = clean(it.description);
        const sug = clean(it.suggestion);
        const descH = desc ? this.height(desc, 'body', 9.5, descW) : 0;
        const sugH = sug ? this.height(`Next: ${sug}`, 'body', 9, descW) + 3 : 0;
        const h = Math.max(this.height(it.metric, 'body', 10, nameW), descH + sugH) + 16;
        this.ensure(h);
        const ry = this.y + 8;
        this.text(sentenceCase(clean(it.metric)), M.x, ry, 'body', 10, C.ink, { width: nameW });
        if (desc) this.text(desc, descX, ry, 'body', 9.5, C.ink2, { width: descW });
        if (sug) this.text(`Next: ${sug}`, descX, ry + descH + 3, 'body', 9, C.accent, { width: descW });
        const max = it.maxScore || 0;
        const val = `${fmt1(it.score)}/${fmt1(max)}`;
        this.text(val, PAGE.w - M.x - 100, ry, 'mono', 9.5, C.ink, { width: 100, align: 'right' });
        this.bar(PAGE.w - M.x - 100, ry + 15, 100, 4, max ? it.score / max : 0);
        this.y += h;
        this.hair(this.y);
      });
      this.y += 22;
    });
  }

  // --- skills and badges ----------------------------------------------------

  skillsAndBadges(d: PDFExportData) {
    if (d.skills.length) {
      this.section('Skills', 'Detected from your repositories. The meter is proficiency; the figure is how many projects use it.', 160);
      const groups = new Map<string, ExtractedSkill[]>();
      [...d.skills]
        .sort((a, b) => b.projectCount - a.projectCount)
        .forEach((s) => {
          const g = SKILL_GROUP[s.category] || 'Other';
          groups.set(g, [...(groups.get(g) || []), s]);
        });
      const colW = (W - 28) / 2;
      groups.forEach((skills, group) => {
        const list = skills.slice(0, 12);
        const rows = Math.ceil(list.length / 2);
        this.ensure(26 + Math.min(rows, 2) * 22);
        this.text(group, M.x, this.y, 'bodyM', 10.5, C.ink);
        this.y += 18;
        for (let r = 0; r < rows; r++) {
          // A long skill name wraps inside its own cell; the row grows to fit it.
          const pair = [list[r * 2], list[r * 2 + 1]].filter(Boolean) as ExtractedSkill[];
          const rowH = Math.max(22, ...pair.map((s) => this.height(s.name, 'body', 10, colW - 96) + 10));
          this.ensure(rowH);
          [0, 1].forEach((col) => {
            const s = list[r * 2 + col];
            if (!s) return;
            const x = M.x + col * (colW + 28);
            this.text(s.name, x, this.y + 4, 'body', 10, C.ink, { width: colW - 96 });
            const level = SKILL_LEVEL[s.proficiency] || 1;
            for (let i = 0; i < 4; i++) this.box(x + colW - 84 + i * 11, this.y + 7, 8, 8, i < level ? C.cool : C.track, undefined, 1.5);
            const n = String(s.projectCount || 0);
            this.text(n, x + colW - 30, this.y + 4, 'mono', 9.5, C.muted, { width: 30, align: 'right' });
          });
          this.y += rowH;
          this.hair(this.y - 2, M.x, W, C.rule);
        }
        this.y += 14;
      });
      this.ensure(18);
      this.text('Meter: beginner, intermediate, advanced, expert.', M.x, this.y, 'body', 8.5, C.muted);
      this.y += 16;
    }

    if (d.badges.length) {
      this.section('Badges earned', undefined, 60);
      const colW = (W - 16) / 2;
      for (let i = 0; i < d.badges.length; i += 2) {
        const pair = d.badges.slice(i, i + 2);
        const h = Math.max(...pair.map((b) => this.height(clean(b.description), 'body', 9.5, colW - 28))) + 40;
        this.ensure(h + 8);
        pair.forEach((b, col) => {
          const x = M.x + col * (colW + 16);
          this.box(x, this.y, colW, h, C.page, C.rule, 6);
          this.box(x + 14, this.y + 15, 7, 7, C.accent, undefined, 1.5);
          this.text(clean(b.name), x + 28, this.y + 12, 'bodyM', 10.5, C.ink, { width: colW - 40 });
          this.text(clean(b.description), x + 28, this.y + 28, 'body', 9.5, C.muted, { width: colW - 40 });
        });
        this.y += h + 8;
      }
    }
  }

  // --- repositories ---------------------------------------------------------

  repositories(d: PDFExportData) {
    const repos = [...(d.repositories || [])].sort((a, b) => (b.stars || 0) - (a.stars || 0)).slice(0, 10);
    if (!repos.length) return;
    this.section('Top repositories', 'By stars. Private repositories count towards your score and are marked.', 120);
    // Fixed columns with a gutter between each; every cell wraps inside its own
    // column and the row grows to its tallest cell, so nothing can overlap.
    const gutter = 16;
    const nameW = 268;
    const langW = 104;
    const numW = (W - nameW - langW - gutter * 3) / 2;
    const cols = {
      name: M.x,
      lang: M.x + nameW + gutter,
      stars: M.x + nameW + langW + gutter * 2,
      forks: M.x + nameW + langW + numW + gutter * 3,
    };
    const head = () => {
      this.hair(this.y, M.x, W, C.rule2);
      this.y += 8;
      this.text('Repository', cols.name, this.y, 'body', 8.5, C.muted, { width: nameW });
      this.text('Language', cols.lang, this.y, 'body', 8.5, C.muted, { width: langW });
      this.text('Stars', cols.stars, this.y, 'body', 8.5, C.muted, { width: numW, align: 'right' });
      this.text('Forks', cols.forks, this.y, 'body', 8.5, C.muted, { width: numW, align: 'right' });
      this.y += 17;
      this.hair(this.y);
    };
    head();
    repos.forEach((r) => {
      const name = clean(r.name) || 'Untitled';
      const desc = clean(r.description);
      const lang = clean(r.language) || 'None';
      const pad = 9;
      const nameH = this.height(name, 'mono', 10, nameW);
      const privH = r.isPrivate ? 14 : 0;
      const descH = desc ? this.height(desc, 'body', 8.5, nameW) + 3 : 0;
      const langH = this.height(lang, 'body', 9.5, langW);
      const h = Math.max(nameH + privH + descH, langH, 12) + pad * 2;
      if (this.y + h > this.limit) {
        this.newPage();
        head();
      }
      const ry = this.y + pad;
      let ny = ry;
      this.text(name, cols.name, ny, 'mono', 10, C.ink, { width: nameW });
      ny += nameH;
      if (r.isPrivate) {
        this.text('Private', cols.name, ny + 1, 'body', 8.5, C.accent, { width: nameW });
        ny += privH;
      }
      if (desc) this.text(desc, cols.name, ny + 3, 'body', 8.5, C.muted, { width: nameW });
      this.text(lang, cols.lang, ry, 'body', 9.5, C.ink2, { width: langW });
      this.text(String(r.stars || 0), cols.stars, ry, 'mono', 10, C.ink, { width: numW, align: 'right' });
      this.text(String(r.forks || 0), cols.forks, ry, 'mono', 10, C.ink, { width: numW, align: 'right' });
      this.y += h;
      this.hair(this.y);
    });
    this.y += 6;
  }

  // --- how it works ---------------------------------------------------------

  method() {
    const body =
      'GitVanta reads your public profile, repositories and recent commits. It scores six categories from 0 to 100 and weights them into one number: ' +
      CATEGORIES.map((c) => `${c.label.toLowerCase()} ${Math.round(c.weight * 100)}%`).join(', ') +
      '. Suggested fixes are tested by re-running the scoring with each fix applied, so every gain in this report is the real one.';
    const h = this.height(body, 'body', 9.5, W - 36) + 44;
    this.ensure(h + 30);
    this.y += 20;
    this.box(M.x, this.y, W, h, C.panel, C.rule, 8);
    this.text('How this score is calculated', M.x + 18, this.y + 15, 'bodyM', 10.5, C.ink);
    this.text(body, M.x + 18, this.y + 32, 'body', 9.5, C.ink2, { width: W - 36 });
    this.y += h;
  }

  // --- running footer -------------------------------------------------------

  footers(d: PDFExportData) {
    const range = this.doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      this.doc.switchToPage(i);
      const fy = PAGE.h - 40;
      this.hair(fy - 10);
      this.text(`GitVanta report for @${d.username}`, M.x, fy, 'body', 8, C.muted, { lineBreak: false });
      const pg = `${i + 1} of ${range.count}`;
      this.text(pg, PAGE.w - M.x - this.width(pg, 'mono', 8), fy, 'mono', 8, C.muted, { lineBreak: false });
    }
  }
}

export default {
  generatePDFReport,
};
