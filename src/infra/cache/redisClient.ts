import { createClient, RedisClientType } from "redis";

import { env } from "../../config/env";

let client: RedisClientType | null = null;
let isConnecting = false;

export async function getRedisClient() {
  if (!env.redisUrl) {
    return null;
  }

  if (client?.isOpen) {
    return client;
  }

  if (!client) {
    client = createClient({
      url: env.redisUrl,
      socket: {
        connectTimeout: 500,
        reconnectStrategy: false
      }
    });
    client.on("error", (error) => {
      console.warn("Redis unavailable:", error.message);
    });
  }

  if (!isConnecting) {
    isConnecting = true;
    try {
      await Promise.race([
        client.connect(),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Redis connection timeout")), 800);
        })
      ]);
    } catch {
      client = null;
      return null;
    } finally {
      isConnecting = false;
    }
  }

  return client.isOpen ? client : null;
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  try {
    const redis = await getRedisClient();

    if (!redis) {
      return null;
    }

    const value = await redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export async function setCachedJson<T>(key: string, value: T, ttlSeconds: number) {
  try {
    const redis = await getRedisClient();

    if (!redis) {
      return;
    }

    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch {
    return;
  }
}
