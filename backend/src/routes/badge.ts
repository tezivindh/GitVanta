import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { AnalysisReport } from '../models';
import { asyncHandler } from '../middleware';
import { badgeQuery, githubUsername } from '../validation/schemas';
import { findUserByUsername } from './profile';

const router = Router();

// GitHub's image proxy fetches from a few shared IPs, so this is generous.
const badgeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
});

function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!);
}

/** Rough Verdana 11px width, close enough for badge layout. */
function textWidth(text: string): number {
  let w = 0;
  for (const ch of text) {
    if ('il.,:;|!\''.includes(ch)) w += 3.5;
    else if ('mwMW@'.includes(ch)) w += 10;
    else if (ch === ' ') w += 3.6;
    else if (/[A-Z0-9]/.test(ch)) w += 7.5;
    else w += 6.5;
  }
  return Math.ceil(w);
}

function scoreColor(score: number | null): string {
  if (score === null) return '#9f9f9f';
  if (score >= 80) return '#2ea043';
  if (score >= 60) return '#7cb342';
  if (score >= 40) return '#f0a020';
  return '#e05d44';
}

export function renderBadge(label: string, value: string, color: string, style: 'flat' | 'flat-square'): string {
  const pad = 10;
  const lw = textWidth(label) + pad;
  const vw = textWidth(value) + pad;
  const w = lw + vw;
  const radius = style === 'flat' ? 3 : 0;
  const l = escapeXml(label);
  const v = escapeXml(value);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${l}: ${v}">
<title>${l}: ${v}</title>
<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
<clipPath id="r"><rect width="${w}" height="20" rx="${radius}" fill="#fff"/></clipPath>
<g clip-path="url(#r)"><rect width="${lw}" height="20" fill="#555"/><rect x="${lw}" width="${vw}" height="20" fill="${color}"/>${style === 'flat' ? `<rect width="${w}" height="20" fill="url(#s)"/>` : ''}</g>
<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
<text x="${lw / 2}" y="15" fill="#010101" fill-opacity=".3">${l}</text><text x="${lw / 2}" y="14">${l}</text>
<text x="${lw + vw / 2}" y="15" fill="#010101" fill-opacity=".3">${v}</text><text x="${lw + vw / 2}" y="14">${v}</text>
</g></svg>`;
}

/**
 * GET /api/badge/:username.svg
 * Embeddable score badge for READMEs. Always returns an SVG (a 404 would
 * render as a broken image), grey when there is no score yet.
 */
router.get(
  '/:file',
  badgeLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const match = /^(.+)\.svg$/i.exec(req.params.file);
    const parsedName = githubUsername.safeParse(match?.[1] ?? '');
    const query = badgeQuery.safeParse(req.query);
    const style = query.success ? query.data.style : 'flat';
    const label = (query.success && query.data.label) || 'GitVanta';

    let value = 'not analyzed';
    let score: number | null = null;

    if (parsedName.success) {
      const user = await findUserByUsername(parsedName.data);
      if (user) {
        const latest: any = await AnalysisReport.findOne({ userId: user._id })
          .sort({ generatedAt: -1 })
          .select('overallScore')
          .lean();
        if (latest) {
          score = latest.overallScore;
          value = `${score}/100`;
        }
      }
    } else {
      value = 'invalid user';
    }

    res.set({
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // Short cache so new analyses show up; GitHub's proxy honours this.
      'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
    });
    res.send(renderBadge(label, value, scoreColor(score), style));
  })
);

export default router;
