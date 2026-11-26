import { AnalysisReport } from '../models';
import logger from '../utils/logger';

/**
 * Reports used to carry a 24h TTL index, which made MongoDB delete every
 * user's analysis after a day (breaking public profiles and history).
 * Drop that index on startup. Safe to run on every boot.
 */
async function dropAnalysisReportTTL(): Promise<void> {
  const collection = AnalysisReport.collection;
  let indexes: Array<{ name?: string; key: Record<string, unknown>; expireAfterSeconds?: number }>;
  try {
    indexes = (await collection.indexes()) as any;
  } catch (error: any) {
    // Collection doesn't exist yet on a fresh database.
    if (error?.codeName === 'NamespaceNotFound') return;
    throw error;
  }

  for (const index of indexes) {
    const isTTL = index.expireAfterSeconds !== undefined;
    const onExpiresAt = Object.prototype.hasOwnProperty.call(index.key, 'expiresAt');
    if ((isTTL || onExpiresAt) && index.name && index.name !== '_id_') {
      await collection.dropIndex(index.name);
      logger.info(`Migration: dropped index ${index.name} on analysisreports`);
    }
  }
}

export async function runMigrations(): Promise<void> {
  try {
    await dropAnalysisReportTTL();
  } catch (error: any) {
    // Never block startup on a migration; log and continue.
    logger.error(`Migration failed: ${error.message}`);
  }
}
