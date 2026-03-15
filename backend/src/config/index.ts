import dotenv from "dotenv";
import path from "path";

dotenv.config({path:path.join(__dirname,"../../.env")})

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
    redis : {
        url :string;
        enabled:boolean;
    }
    rateLimit : {
        windowMs : number;
        maxRequest : number;
    }
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