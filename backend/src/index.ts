// =====================================================
// GITHUB PORTFOLIO ANALYZER - BACKEND SERVER
// =====================================================

import { createApp } from './app';
import config from './config';
import { connectDatabase } from './config/database';
import { initializeRedis } from './config/redis';
import { initializeAI, isAIAvailable, getAIConfig } from './ai';
import logger from './utils/logger';

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    logger.info('Starting GitHub Portfolio Analyzer Backend...');

    // Connect to MongoDB
    await connectDatabase();

    // Initialize Redis (optional)
    initializeRedis();

    // Initialize AI Provider (Groq, Gemini, OpenAI, etc.)
    try {
      initializeAI();
      if (isAIAvailable()) {
        const aiConfig = getAIConfig();
        logger.info(`AI Provider: ${aiConfig.provider} (${aiConfig.model})`);
      } else {
        logger.warn('AI provider not properly configured. AI features will be unavailable.');
        logger.warn('To enable AI, set AI_PROVIDER and the corresponding API key in .env');
      }
    } catch (error: any) {
      logger.warn(`AI initialization failed: ${error.message}`);
    }

    // Create and start Express app
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

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();
