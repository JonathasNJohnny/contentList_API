import { Db, MongoClient } from "mongodb";

import { env } from "../../config/env";

let client: MongoClient | null = null;

export async function getMongoDb(): Promise<Db | null> {
  if (!env.mongoDbDirect) {
    return null;
  }

  try {
    if (!client) {
      client = new MongoClient(env.mongoDbDirect, {
        serverSelectionTimeoutMS: 5000,
      });
    }
    await client.connect();

    const db = client.db(env.mongoDbName);

    return db;
  } catch (error) {
    client = null;

    return null;
  }
}
