import { Request, Response } from "express";

import { env } from "../../config/env";
import { getRedisClient } from "../../infra/cache/redisClient";
import { getMongoDb } from "../../infra/database/mongoClient";

export const healthController = {
  async show(_request: Request, response: Response) {
    const redis = await getRedisClient();
    let mongoStatus = env.mongoDbDirect ? "unavailable" : "not_configured";

    try {
      const mongo = await getMongoDb();

      if (mongo) {
        await mongo.command({ ping: 1 });
        mongoStatus = "connected";
      }
    } catch {
      mongoStatus = "unavailable";
    }

    response.json({
      status: "ok",
      redis: redis?.isOpen ? "connected" : "disabled_or_unavailable",
      mongo: mongoStatus,
    });
  },
};
