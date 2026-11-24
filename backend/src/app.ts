import express, { Application, Request } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config';
import routes from './routes';
import healthRoutes from './routes/health';
import { errorHandler, notFoundHandler, apiLimiter } from './middleware';
import logger from './utils/logger';

// Log the path only. Query strings can carry OAuth codes and other secrets.
morgan.token('path', (req: Request) => (req.originalUrl || req.url).split('?')[0]);
const LOG_FORMAT = ':remote-addr :method :path :status :res[content-length] - :response-time ms';

export function createApp(): Application {
  const app = express();

  // Behind Render/Vercel the client IP is in X-Forwarded-For. Without this,
  // every user shares one rate-limit bucket (the proxy's IP).
  app.set('trust proxy', config.trustProxy);
  app.disable('x-powered-by');

  app.use(
    helmet({
      // JSON API plus an SVG badge meant to be embedded on other sites.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin requests, curl and server-to-server calls send no Origin.
        if (!origin || config.corsOrigins.includes(origin.replace(/\/+$/, ''))) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  if (config.nodeEnv !== 'test') {
    app.use(
      morgan(LOG_FORMAT, {
        stream: { write: (message: string) => logger.info(message.trim()) },
        skip: (req) => req.originalUrl.startsWith('/api/health'),
      })
    );
  }

  // Health checks are not rate limited so uptime monitors never trip it.
  app.use('/api/health', healthRoutes);

  app.use('/api', apiLimiter);
  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
