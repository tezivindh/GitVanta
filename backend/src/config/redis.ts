import Redis from "ioredis";
import config from ".";
import logger from "../utils/logger";
import { CacheOptions } from "../types";


let redisClient : Redis | null = null;

export function initializeRedis(): void {
    if(!config.redis.enabled){
        logger.info('Redis caching is disabled');
        return;
    }
    try {
        redisClient = new Redis(config.redis.url,{
            maxRetriesPerRequest:3,
            retryStrategy: (times) => {
                if(times > 3) {
                    logger.error('Redis connection failed after 3 tries');
                    return null;
                }
                return Math.min(times * 100, 3000);
            },
        })
        redisClient.on('connect',() => {logger.info('Redis connected successfully')});
        redisClient.on('error', (err) => {logger.error('Redis connection error', err)});
        redisClient.on('close', () => {logger.warn('Redis connection closed')});
    } catch (error) {
        logger.error('Failed to initialize Redis: ',error);
    }
}

export function getRedisClient(): Redis | null {
    return redisClient;
}

export function isRedisAvailable(): boolean {
    return redisClient !== null && redisClient.status === 'ready';
}

//Cache data with ttl
export async function cacheSet<T>(key:string, data:T, options: CacheOptions = {}): Promise<void> {
    if(!isRedisAvailable()) return;
    
    const ttl = options.ttl || 3600; // Default 1 hour
    const prefixedKey = options.prefix ? `${options.prefix}:${key}` : key;

    try {
        await redisClient!.setex(prefixedKey, ttl, JSON.stringify(data));
    } catch (error) {
        logger.error('Redis cache set error:', error);
    }
}

// Get cached data
export async function cacheGet<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
  if (!isRedisAvailable()) return null;

  const prefixedKey = options.prefix ? `${options.prefix}:${key}` : key;

  try {
    const data = await redisClient!.get(prefixedKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Redis cache get error:', error);
    return null;
  }
}

//Delete cached data
export async function cacheDelete(key: string, options: CacheOptions = {}): Promise<void> {
  if (!isRedisAvailable()) return;

  const prefixedKey = options.prefix ? `${options.prefix}:${key}` : key;

  try {
    await redisClient!.del(prefixedKey);
  } catch (error) {
    logger.error('Redis cache delete error:', error);
  }
}

// Clear cache by pattern
export async function cacheClear(pattern: string): Promise<void> {
  if (!isRedisAvailable()) return;

  try {
    const keys = await redisClient!.keys(pattern);
    if (keys.length > 0) {
      await redisClient!.del(...keys);
    }
  } catch (error) {
    logger.error('Redis cache clear error:', error);
  }
}

export default {
  initializeRedis,
  getRedisClient,
  isRedisAvailable,
  cacheSet,
  cacheGet,
  cacheDelete,
  cacheClear,
};
