import http from 'http';
import mongoose from 'mongoose';
import { createApp } from './app';
import config from './config';
import { connectDatabase } from './config/database';
import { runMigrations } from './config/migrations';
import { initializeRedis, closeRedis } from './config/redis';
import { initializeAI } from './ai';
import logger from './utils/logger';

const SHUTDOWN_TIMEOUT_MS = 10_000;
let server: http.Server | null = null;
let shuttingDown = false;

function checkProductionConfig(): void {
  if (config.nodeEnv !== 'production') return;
  if (!process.env.JWT_SECRET || config.jwtSecret.length < 32) {
    logger.warn('JWT_SECRET is missing or shorter than 32 characters. Set a long random value.');
  }
  if (!process.env.ENCRYPTION_KEY) {
    logger.warn('ENCRYPTION_KEY is not set. Users cannot save their own AI keys.');
  }
}

async function startServer(): Promise<void> {
  logger.info('Starting GitVanta API...');
  checkProductionConfig();

  await connectDatabase();
  await runMigrations();
  initializeRedis();
  initializeAI();

  const app = createApp();
  server = app.listen(config.port, () => {
    logger.info(`Server listening on port ${config.port} (${config.nodeEnv})`);
    logger.info(`Health check: http://localhost:${config.port}/api/health`);
    if (!config.github.clientId || !config.github.clientSecret) {
      logger.warn('GitHub OAuth credentials not configured. Sign-in will fail.');
    }
  });
  // Slightly longer than typical proxy idle timeouts to avoid 502s on reuse.
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
}

async function shutdown(signal: string, exitCode = 0): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received, shutting down gracefully...`);

  const forceExit = setTimeout(() => {
    logger.error('Shutdown timed out, forcing exit.');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  try {
    if (server) {
      // Stop accepting new connections; let in-flight requests finish.
      await new Promise<void>((resolve) => server!.close(() => resolve()));
      server.closeIdleConnections?.();
    }
    await mongoose.connection.close();
    await closeRedis();
    logger.info('Shutdown complete.');
  } catch (error: any) {
    logger.error(`Error during shutdown: ${error.message}`);
    exitCode = 1;
  }
  process.exit(exitCode);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled rejection: ${reason instanceof Error ? reason.stack : String(reason)}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error.stack || error.message}`);
  void shutdown('uncaughtException', 1);
});

startServer().catch((error) => {
  logger.error(`Failed to start server: ${error?.message || error}`);
  process.exit(1);
});
