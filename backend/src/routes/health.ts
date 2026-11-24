import { Router } from 'express';
import mongoose from 'mongoose';
import config from '../config';
import { isRedisAvailable } from '../config/redis';
import { isServerAIAvailable } from '../ai';

const router = Router();
const startedAt = Date.now();

const MONGO_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

/**
 * GET /api/health
 * 200 when the database is reachable, 503 otherwise. Redis and AI are
 * optional, so they are reported but don't fail the check.
 */
router.get('/', async (_req, res) => {
  const state = mongoose.connection.readyState;
  let databaseOk = state === 1;

  if (databaseOk) {
    try {
      await mongoose.connection.db?.admin().ping();
    } catch {
      databaseOk = false;
    }
  }

  res.status(databaseOk ? 200 : 503).json({
    success: databaseOk,
    status: databaseOk ? 'ok' : 'degraded',
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    checks: {
      database: databaseOk ? 'ok' : MONGO_STATES[state] || 'unknown',
      redis: config.redis.enabled ? (isRedisAvailable() ? 'ok' : 'unavailable') : 'disabled',
      serverAI: isServerAIAvailable() ? 'configured' : 'not_configured',
    },
  });
});

export default router;
