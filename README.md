# GitHub Portfolio Analyzer & Enhancer

A production-ready SaaS application that analyzes GitHub portfolios, provides transparent scoring, offers AI-powered enhancements, and generates professional profiles for developers.

## Features

### Core Analytics
- **Portfolio Scoring (0-100)**: Comprehensive scoring with transparent breakdown across 6 categories:
  - Code Quality (20 points)
  - Documentation (20 points)
  - Activity (15 points)
  - Diversity (15 points)
  - Community Impact (15 points)
  - Professionalism (15 points)

### AI-Powered Features
- **README Enhancement**: Improve repository READMEs with AI suggestions
- **Resume Bullets**: Generate professional resume bullet points from projects
- **Portfolio Summary**: Create compelling developer portfolio summaries
- **Improvement Roadmap**: Get personalized recommendations for growth

### Additional Features
- **Skill Extraction**: Automatically detect and categorize technical skills
- **Badge System**: Earn badges for achievements (Polyglot, Open Source Contributor, etc.)
- **Recruiter View**: Generate a recruiter-friendly profile
- **Profile Comparison**: Compare your portfolio against other developers
- **PDF Export**: Export professional PDF reports

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis (optional)
- **Authentication**: GitHub OAuth + JWT
- **AI**: Google Gemini API
- **PDF Generation**: PDFKit
- **Logging**: Winston

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Routing**: React Router v6
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   │   ├── index.ts     # Main config
│   │   │   ├── database.ts  # MongoDB connection
│   │   │   ├── redis.ts     # Redis client
│   │   │   └── gemini.ts    # Gemini AI setup
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utilities
│   │   │   ├── scoringEngine.ts  # Scoring logic
│   │   │   ├── logger.ts    # Logging
│   │   │   └── errors.ts    # Error classes
│   │   ├── app.ts           # Express app
│   │   └── server.ts        # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/             # API clients
│   │   ├── components/
│   │   │   ├── charts/      # Chart components
│   │   │   ├── layout/      # Layout components
│   │   │   └── ui/          # UI primitives
│   │   ├── pages/
│   │   │   ├── dashboard/   # Dashboard pages
│   │   │   └── ...          # Public pages
│   │   ├── store/           # Zustand stores
│   │   ├── types/           # TypeScript types
│   │   ├── App.tsx          # Main app
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
- Google Gemini API key

### Environment Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd github_portfolio_analyzer_and_enhancer
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
PORT=3001

# MongoDB
MONGODB_URI=mongodb://localhost:27017/portfolio_analyzer

# Redis (optional)
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=false

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback

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
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:3001/api
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
- `GET /api/auth/github` - Initiate GitHub OAuth
- `GET /api/auth/github/callback` - OAuth callback
- `GET /api/auth/me` - Get current user

### Analysis
- `POST /api/analysis/full/:username` - Run full portfolio analysis
- `GET /api/analysis/latest` - Get latest analysis report
- `GET /api/analysis/history` - Get analysis history
- `GET /api/analysis/recruiter-profile` - Get recruiter profile
- `POST /api/analysis/compare/:username` - Compare with another profile

### Enhancements (AI)
- `POST /api/enhancements/readme` - Enhance a README
- `POST /api/enhancements/resume-bullets` - Generate resume bullets
- `POST /api/enhancements/portfolio-summary` - Generate portfolio summary
- `POST /api/enhancements/improvement-roadmap` - Generate improvement roadmap

### Repositories
- `GET /api/repositories` - List analyzed repositories
- `GET /api/repositories/:name` - Get repository details
- `GET /api/repositories/export/pdf` - Export PDF report

## Scoring Algorithm

The scoring engine uses transparent, modular scoring across 6 categories:

### Code Quality (0-20 points)
- Has description (2 pts)
- Has topics/tags (2 pts)
- Has license (3 pts)
- Has .gitignore (2 pts)
- Repository size indicates substance (3 pts)
- Not archived (2 pts)
- Multiple files/complexity (3 pts)
- Has CI/CD indicators (3 pts)

### Documentation (0-20 points)
- Has README (5 pts)
- README length quality (0-8 pts based on length)
- Has wiki enabled (3 pts)
- Has homepage/demo (4 pts)

### Activity (0-15 points)
- Updated within 3 months (5 pts)
- Updated within 6 months (3 pts)
- Updated within 1 year (1 pt)
- Has recent commits (up to 5 pts)
- Issues enabled (2 pts)
- Open issues being worked (3 pts)

### Diversity (0-15 points)
- Primary language (5 pts)
- Bonus for popular languages (3 pts)
- Multiple topics (up to 7 pts)

### Community (0-15 points)
- Stars scaling (1-50: 3-10 pts, 50+: 10-15 pts)
- Forks (up to 5 pts)

### Professionalism (0-15 points)
- Has bio (3 pts)
- Has avatar (2 pts)
- Has company (2 pts)
- Has blog/website (3 pts)
- Has location (2 pts)
- Has Twitter (1 pt)
- Hireable flag (2 pts)

## Badges

Earn badges based on your portfolio:
- **Open Source Contributor**: Contribute to open source projects
- **Polyglot**: Use 5+ programming languages
- **Consistent Coder**: Regular commit activity
- **Great Documenter**: Well-documented repositories
- **Popular Developer**: 100+ stars across repositories
- **Community Member**: Active community engagement
- **Professional Profile**: Complete GitHub profile
- **Innovator**: Diverse project portfolio

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
