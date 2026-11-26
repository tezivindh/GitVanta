import dotenv from "dotenv";
import path from "path";

// .env.local (developer overrides) wins over .env; real env vars win over both.
dotenv.config({ path: path.join(__dirname, "../../.env.local") });
dotenv.config({ path: path.join(__dirname, "../../.env") });

interface Config {
    port : number;
    nodeEnv : string;
    mongodbUri : string;
    jwtSecret : string;
    jwtExpiresIn : string;
    github :{
        clientId : string;
        clientSecret : string;
        callbackUrl : string;
    };
    frontendUrl : string;
    /** Origins allowed by CORS. Defaults to FRONTEND_URL. */
    corsOrigins : string[];
    /** Express "trust proxy" setting; 1 = one reverse proxy (Render, Vercel, etc). */
    trustProxy : number | boolean;
    redis : {
        url :string;
        enabled:boolean;
    }
    rateLimit : {
        windowMs : number;
        maxRequest : number;
    }
}

function parseTrustProxy(value: string | undefined, isProd: boolean): number | boolean {
    if (value === undefined || value === '') return isProd ? 1 : false;
    if (value === 'true') return true;
    if (value === 'false') return false;
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : false;
}

const config : Config = {
    port : parseInt(process.env.PORT || '5000', 10),
    nodeEnv : process.env.NODE_ENV || 'development',
    mongodbUri : process.env.MONGODB_URI || 'mongodb://localhost:27017/gitvanta',
    jwtSecret : process.env.JWT_SECRET || 'jwt-secret-for-development',
    jwtExpiresIn : process.env.JWT_EXPIRES_IN || '7d',
    github : {
        clientId : process.env.GITHUB_CLIENT_ID || '',
        clientSecret : process.env.GITHUB_CLIENT_SECRET || '',
        callbackUrl : process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
    },
    frontendUrl : process.env.FRONTEND_URL || 'http://localhost:5173',
    corsOrigins : (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
        .split(',')
        .map((o) => o.trim().replace(/\/+$/, ''))
        .filter(Boolean),
    trustProxy : parseTrustProxy(process.env.TRUST_PROXY, process.env.NODE_ENV === 'production'),
    redis : {
        url : process.env.REDIS_URL || "redis://localhost:6379",
        enabled : process.env.REDIS_ENABLED === "true"
    },
    rateLimit :{
        windowMs : parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        maxRequest : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
    }
}

export default config;