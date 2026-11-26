# GitVanta

GitVanta scores a developer's GitHub portfolio from 0 to 100 across six categories, shows the metric behind every point, lists the fixes that raise the score most, and turns the result into a shareable public profile. AI features (README rewrites, resume bullets, summaries, roadmaps, repository reviews) run on a server key or on the user's own key from any major provider.

- **Backend:** Express, TypeScript, MongoDB (Mongoose), optional Redis, in `backend/`
- **Frontend:** React 18, Vite, Tailwind CSS v4, Zustand, Recharts, in `frontend/`

## Features

### Scoring
- **0–100 score across six weighted categories**, each scored 0–100 from concrete metrics (see [Scoring](#scoring)). The dashboard shows the weighted formula as a table and every metric with its value and a suggestion.
- **Quick wins**: up to three repo-level fixes ("Add a LICENSE to X", "Add tests to Y") with the exact point gain for each, computed by re-running the scoring engine with the fix applied.
- **Score history**: every analysis is kept (newest 60), with a trend chart and the change since the last run.
- **Skill extraction**: languages, frameworks, databases, cloud and tools, with a proficiency estimate.
- **19 badges**, each with a fixed rule.
- **Private repositories** are analysed too (with the user's GitHub token), but never shown publicly unless the owner opts in.

### AI
- README rewrite, resume bullets, portfolio summary, improvement roadmap, project descriptions.
- **Rate all repositories with AI**: one request rates up to 30 repos (1–10, verdict, strengths, fixes); cached on the report.
- **Bring your own key** in Settings → AI provider: OpenAI, Anthropic, Google Gemini, Groq, OpenRouter, Mistral, DeepSeek, Together, or any OpenAI-compatible server (Ollama, LM Studio, vLLM, LiteLLM) via a custom base URL. Live model list, show/hide key, and a "Test connection" button that makes one small real request.
- Keys are encrypted with AES-256-GCM (`ENCRYPTION_KEY`), bound to the user, and only ever returned masked (`sk-…a1b2`). Users can switch their key off, change it, or delete it.
- Each AI result says which provider and model produced it, and whether the user's key or the server key was used. With no key anywhere, the UI links to Settings.
- Users on their own key get a higher AI rate limit (500/hour vs 50/hour).

### Sharing
- **Public profile** at `/profile/:username`: score, categories, skills, badges, AI headline and the projects the owner chooses. Hidden repos stay hidden; opted-in private repos show without a link.
- **Professional view** with copyable profile link.
- **README badge**: `![GitVanta score](https://<api-host>/api/badge/<username>.svg)` (supports `?style=flat-square` and `?label=`).
- **Compare** with any public GitHub account, scored by the same engine.
- **PDF report** and **JSON export** of the latest analysis.

### Account
- Export all stored data as JSON, sign out of every other device, delete the account (also revokes the GitHub OAuth grant).
- Light, dark or match-system theme on every page.

## Scoring

Each category is the sum of its metrics (each category totals 100), then weighted:

| Category | Weight | Metrics (max points) |
|---|---|---|
| Code quality | 25% | Portfolio size (25), language range (25), repos with tests (25), descriptive commit messages (25) |
| Documentation | 20% | README presence (30), README depth (30), licenses (20), contributing guides (20) |
| Activity | 20% | Repos pushed in the last 30 days (35), days with commits in the last year (35), repos updated in the last year (30) |
| Diversity | 15% | Languages (40), topics (30), kinds of projects (30) |
| Community | 10% | Followers (25), stars (30), forks (25), follower/following balance (20) |
| Professionalism | 10% | Profile completeness (25), profile README (20), linked social accounts (15), repo naming (20), repo descriptions (20) |

Per-repo checks (README, tests, contributing guide) cover the 30 most recently updated repositories; commit metrics sample the user's own commits from their 10 most recently pushed repos. The engine lives in `backend/src/utils/scoringEngine.ts`.

## Getting started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- A GitHub OAuth app ([create one](https://github.com/settings/developers)) with callback `http://localhost:5000/api/auth/github/callback`
- Optional: an AI provider key, Redis

### Backend
```bash
cd backend
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:5000
```

Minimum `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/gitvanta
JWT_SECRET=<long random string>
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
FRONTEND_URL=http://localhost:5173
ENCRYPTION_KEY=<node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">
AI_PROVIDER=groq
GROQ_API_KEY=...
```
See [`backend/.env.example`](backend/.env.example) for every option (other providers, rate limits, CORS, proxy trust, Redis).

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local   # optional in development
npm run dev                  # http://localhost:5173
```

### Production build
```bash
cd backend && npm run build && npm start
cd frontend && npm run build   # static files in frontend/dist
```

### Deploying
- **API (e.g. Render):** set the variables above, plus `NODE_ENV=production`. `TRUST_PROXY` defaults to `1` in production so rate limits apply per client. `ENCRYPTION_KEY` is required for users to save their own AI keys; keep it stable, because changing it makes saved keys unreadable.
- **Frontend (e.g. Vercel):** set `VITE_API_URL` to the API URL ending in `/api`. `VITE_SITE_URL` is optional on Vercel (the production domain is used for Open Graph tags). `frontend/vercel.json` rewrites all routes to `index.html`.
- On first start the API runs a small migration that drops the old 24-hour TTL index on analysis reports.

## API

All responses are JSON. Errors look like `{ "success": false, "error": "message", "code": "ERROR_CODE", "details"?: [...] }`. Inputs are validated with zod.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | | Health check (503 if MongoDB is down) |
| GET | `/api/auth/github` | | Start GitHub sign-in |
| GET | `/api/auth/me` | ✓ | Current user |
| POST | `/api/analysis/analyze` | ✓ | Run an analysis (3 per day) |
| GET | `/api/analysis/latest` | ✓ | Latest analysis |
| GET | `/api/analysis/history?limit=30` | ✓ | Score history and change since last run |
| GET | `/api/analysis/score` | ✓ | Category scores and metric breakdown |
| GET | `/api/analysis/professional-profile[?refresh=true]` | ✓ | Professional view (AI summary cached) |
| GET | `/api/analysis/compare/:username` | ✓ | Compare with a GitHub user (15/hour) |
| GET | `/api/analysis/export/pdf` | ✓ | PDF report |
| GET | `/api/repositories` | ✓ | Your repositories (`page`, `per_page`, `sort`) |
| GET | `/api/enhance/status` | ✓ | Which AI provider is active |
| POST | `/api/enhance/readme/:repo` | ✓ | Rewrite a README |
| POST | `/api/enhance/resume/:repo` | ✓ | Resume bullets for a repo |
| POST | `/api/enhance/summary` | ✓ | Portfolio summary |
| POST | `/api/enhance/roadmap` | ✓ | Improvement roadmap |
| POST | `/api/enhance/repo-reviews` | ✓ | Rate up to 30 repos in one AI request |
| GET | `/api/settings/ai/providers` | ✓ | Supported AI providers and default models |
| GET / PUT / PATCH / DELETE | `/api/settings/ai` | ✓ | View, save, toggle or delete your AI key |
| POST | `/api/settings/ai/test` | ✓ | Test a provider, key and model |
| POST | `/api/settings/ai/models` | ✓ | List models available to a key |
| GET / PUT | `/api/settings/profile` | ✓ | Choose which repos appear publicly |
| GET | `/api/account/export` | ✓ | Download all your data |
| POST | `/api/account/sessions/revoke` | ✓ | Sign out of all other devices |
| DELETE | `/api/account` | ✓ | Delete your account (`{ "confirm": "<username>" }`) |
| GET | `/api/profile/:username` | | Public profile |
| GET | `/api/badge/:username.svg` | | README score badge |

## Security notes
- Helmet, CORS limited to `CORS_ORIGINS`, 1 MB body limit, per-IP and per-user rate limits.
- Request logs omit query strings, so OAuth codes are never logged; AI provider errors are scrubbed of anything that looks like a key.
- Users' AI keys are encrypted at rest and never returned in full. Custom AI base URLs are checked against private and link-local addresses on save and on every use (unless `ALLOW_PRIVATE_AI_URLS=true`), and redirects are not followed.
- Graceful shutdown on `SIGTERM`/`SIGINT`.

## Contributing

1. Fork the repository and create a branch.
2. Run `npm run build` in both `backend/` and `frontend/` before opening a pull request.
3. Open a pull request describing the change.
