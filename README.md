# GitVanta

A production-ready SaaS application that analyzes GitHub portfolios, provides transparent scoring across 6 categories, offers AI-powered enhancements, and generates professional shareable profiles for developers.

## Features

### Core Analytics
- **Portfolio Scoring (0–100)**: Comprehensive scoring with transparent breakdown across 6 categories:
  - Code Quality (20 points)
  - Documentation (20 points)
  - Activity (15 points)
  - Diversity (15 points)
  - Community Impact (15 points)
  - Professionalism (15 points) — includes Social Presence scoring (linked accounts on GitHub)
- **Skill Extraction**: Automatically detects and categorizes technical skills (languages, frameworks, tools, cloud, databases)
- **Analytics Dashboard**: Visual breakdowns with charts — category radar, score breakdown, activity timeline, skill pie chart

### AI-Powered Features
- **README Enhancement**: Improve repository READMEs with AI suggestions
- **Resume Bullets**: Generate professional resume bullet points from projects
- **Portfolio Summary**: Create compelling developer portfolio summaries
- **Improvement Roadmap**: Get personalized recommendations for growth

### Badge System (19 Badges)
Earn achievement badges across multiple tiers:

| Badge | Criteria | Category |
|---|---|---|
| ❤️ Open Source Contributor | Forked/contributed to open source repos | Community |
| 🌐 Polyglot | 5+ programming languages | Diversity |
| 🔥 Consistent Coder | Activity score ≥ 60 | Activity |
| 📖 Great Documenter | Documentation score ≥ 70 | Documentation |
| 🌟 Popular Developer | 50+ stars total | Community |
| 👥 Community Member | 5+ forks, 10+ followers, or 20+ stars | Community |
| 🛡️ Professional Profile | Professionalism ≥ 70 or has profile README | Professionalism |
| ⚡ Innovator | Diversity score ≥ 70 | Diversity |
| 🏆 Mentor | Educational repos or 30+ repos | Community |
| 🏆 Code Master | Code quality ≥ 90 | Code Quality |
| ⭐ Quality Coder | Code quality ≥ 70 | Code Quality |
| 📚 Documentation Hero | Documentation ≥ 90 | Documentation |
| 🔥 Active Contributor | Activity ≥ 80 | Activity |
| ⭐ Star Collector | 100+ stars | Community |
| 👥 Influencer | 100+ followers | Community |
| 🚀 Prolific Creator | 50+ repositories | Professionalism |
| 🔨 Builder | 20+ repositories | Professionalism |
| 💎 Elite Developer | Overall score ≥ 90 | Overall |
| 🎯 Skilled Developer | Overall score ≥ 75 | Overall |

### Professional View & Sharing
- **Recruiter View**: Generate a recruiter-friendly portfolio with AI-powered headline, summary, and highlights
- **Public Profile Page**: Shareable link at `/profile/:username` — standalone dark-themed page with hero section, scores, badges, skills, featured repos, and social pills
- **Social Presence Scoring**: Detects linked social accounts (Twitter/X, LinkedIn, etc.) via GitHub's social accounts API and awards up to 15 points

### Additional Features
- **Profile Comparison**: Compare your portfolio side-by-side against any GitHub developer
- **PDF Export**: Export professional PDF reports
- **JSON Export**: Raw data export for integration or analysis
- **Dark Mode**: Full dark/light theme toggle with persistent preference
- **Settings Page**: User preferences and appearance customization

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis with ioredis (1hr TTL)
- **Authentication**: GitHub OAuth + JWT
- **AI Providers**: Google Gemini API, Groq (configurable)
- **PDF Generation**: PDFKit
- **Logging**: Winston

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS v4
- **State Management**: Zustand (with persist middleware)
- **Routing**: React Router v6
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── ai/              # AI provider abstraction
│   │   │   ├── providers/   # Gemini, Groq providers
│   │   │   ├── config.ts    # AI configuration
│   │   │   └── types.ts     # AI types
│   │   ├── config/          # Configuration files
│   │   │   ├── index.ts     # Main config
│   │   │   ├── database.ts  # MongoDB connection
│   │   │   ├── redis.ts     # Redis client
│   │   │   └── gemini.ts    # Gemini AI setup
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/       # Auth, rate limiter, error handler
│   │   ├── models/          # Mongoose schemas (User, AnalysisReport, RepoInsight)
│   │   ├── routes/          # API routes (auth, analysis, enhancement, repos, profile)
│   │   ├── services/        # Business logic (AI, analysis, GitHub, PDF)
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utilities
│   │   │   ├── scoringEngine.ts  # Scoring logic + badge engine + skill extraction
│   │   │   ├── logger.ts         # Structured logging
│   │   │   └── errors.ts         # Custom error classes
│   │   ├── app.ts           # Express app
│   │   └── index.ts         # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/             # API clients (auth, analysis, enhancement, repos)
│   │   ├── components/
│   │   │   ├── charts/      # Recharts components (Radar, Pie, Timeline, Breakdown)
│   │   │   ├── layout/      # DashboardLayout, Header, Sidebar
│   │   │   └── ui/          # Card, Button, Input, Modal, ScoreCircle, Badge, etc.
│   │   ├── pages/
│   │   │   ├── dashboard/   # Overview, Analytics, Repos, Skills, Badges,
│   │   │   │                # Enhancements, Compare, Recruiter, Export, Settings
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── AuthCallbackPage.tsx
│   │   │   └── PublicProfilePage.tsx
│   │   ├── store/           # Zustand stores (auth, analysis, repos, theme)
│   │   ├── types/           # TypeScript types
│   │   ├── App.tsx          # Main app + routing
│   │   └── main.tsx         # Entry point
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Redis (optional, for caching)
- GitHub OAuth App credentials
- Google Gemini API key (or Groq API key)

### Environment Setup

1. **Clone the repository**
```bash
git clone https://github.com/tezivindh/GitVanta.git
cd GitVanta
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your credentials:
```env
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/portfolio_analyzer

# Redis (optional)
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=false

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# JWT
JWT_SECRET=your_jwt_secret_key_min_32_chars
JWT_EXPIRES_IN=7d

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### Running the Application

**Development Mode**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

The backend runs on `http://localhost:5000` and the frontend on `http://localhost:5173`.

**Production Build**

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

## API Endpoints

### Authentication
- `GET /api/auth/github` — Initiate GitHub OAuth
- `GET /api/auth/github/callback` — OAuth callback
- `GET /api/auth/me` — Get current user

### Analysis
- `POST /api/analysis/full/:username` — Run full portfolio analysis
- `GET /api/analysis/latest` — Get latest analysis report
- `GET /api/analysis/history` — Get analysis history
- `GET /api/analysis/recruiter-profile` — Get recruiter profile
- `POST /api/analysis/compare/:username` — Compare with another profile

### Enhancements (AI-powered)
- `POST /api/enhancements/readme` — Enhance a README
- `POST /api/enhancements/resume-bullets` — Generate resume bullets
- `POST /api/enhancements/portfolio-summary` — Generate portfolio summary
- `POST /api/enhancements/improvement-roadmap` — Generate improvement roadmap

### Repositories
- `GET /api/repositories` — List analyzed repositories
- `GET /api/repositories/:name` — Get repository details
- `GET /api/repositories/export/pdf` — Export PDF report

### Public Profile
- `GET /api/profile/:username` — Get public profile data (no auth required)

## Scoring Algorithm

The scoring engine uses transparent, modular scoring across 6 categories:

### Code Quality (0–20 points)
- Has description (2 pts)
- Has topics/tags (2 pts)
- Has license (3 pts)
- Has .gitignore (2 pts)
- Repository size indicates substance (3 pts)
- Not archived (2 pts)
- Multiple files/complexity (3 pts)
- Has CI/CD indicators (3 pts)

### Documentation (0–20 points)
- Has README (5 pts)
- README length quality (0–8 pts based on length)
- Has wiki enabled (3 pts)
- Has homepage/demo (4 pts)

### Activity (0–15 points)
- Updated within 3 months (5 pts)
- Updated within 6 months (3 pts)
- Updated within 1 year (1 pt)
- Has recent commits (up to 5 pts)
- Issues enabled (2 pts)
- Open issues being worked (3 pts)

### Diversity (0–15 points)
- Primary language (5 pts)
- Bonus for popular languages (3 pts)
- Multiple topics (up to 7 pts)

### Community (0–15 points)
- Stars scaling (1–50: 3–10 pts, 50+: 10–15 pts)
- Forks (up to 5 pts)

### Professionalism (0–15 points)
- Has bio (3 pts)
- Has avatar (2 pts)
- Has company (2 pts)
- Has blog/website (3 pts)
- Has location (2 pts)
- Has hireable flag (2 pts)
- Social Presence (up to 15 pts) — linked social accounts via GitHub API

## Dark Mode

GitVanta supports full dark/light mode theming:

- Toggle via **Settings → Appearance** in the dashboard
- Persisted to `localStorage` via Zustand persist middleware
- Uses TailwindCSS v4 `@custom-variant dark` with class-based toggling on `<html>`
- Every page, component, and UI element supports both themes

## License

MIT License — see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
