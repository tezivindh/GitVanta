import { createApp } from './app';
import config from './config';
import { connectDatabase } from './config/database';
import { runMigrations } from './config/migrations';
import { initializeRedis } from './config/redis';
import { initializeAI } from './ai';
import logger from './utils/logger';

async function startServer(): Promise<void> {
  try {
    logger.info('Starting GitHub Portfolio Analyzer Backend...');

  
    await connectDatabase();
    await runMigrations();

    initializeRedis();

    initializeAI();

    const app = createApp();

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`API URL: http://localhost:${config.port}/api`);
      logger.info(`Health check: http://localhost:${config.port}/api/health`);
    
      if (!config.github.clientId || !config.github.clientSecret) {
        logger.warn('GitHub OAuth credentials not configured. Authentication will fail.');
      }
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();
