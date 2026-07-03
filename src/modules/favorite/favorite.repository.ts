import { ObjectId } from "mongodb";

import { getMongoDb } from "../../infra/database/mongoClient";
import { Favorite, User } from "../../models/User";
import { AppError } from "../../shared/errors/AppError";

const collectionName = "users";

async function getUsersCollection() {
  const db = await getMongoDb();

  if (!db) {
    throw new AppError("MongoDB is not configured or unavailable.", 503);
  }

  return db.collection<User>(collectionName);
}

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  return new ObjectId(id);
}

export const favoriteRepository = {
  async findUserById(userId: string) {
    const users = await getUsersCollection();
    const _id = toObjectId(userId);

    if (!_id) {
      return null;
    }

    return users.findOne({ _id });
  },

  async addFavorite(userId: string, favorite: Favorite) {
    const users = await getUsersCollection();
    const _id = toObjectId(userId);

    if (!_id) {
      return null;
    }

    await users.updateOne(
      { _id },
      {
        $push: { favorites: favorite },
        $set: { updatedAt: new Date() },
      },
    );

    return users.findOne({ _id });
  },

  async updateFavorite(
    userId: string,
    contentId: string,
    data: Partial<Favorite>,
  ) {
    const users = await getUsersCollection();
    const _id = toObjectId(userId);

    if (!_id) {
      return null;
    }

    const setData = Object.entries(data).reduce<Record<string, unknown>>(
      (accumulator, [key, value]) => {
        accumulator[`favorites.$.${key}`] = value;

        return accumulator;
      },
      { updatedAt: new Date() },
    );

    await users.updateOne(
      { _id, "favorites.contentId": contentId },
      { $set: setData },
    );

    return users.findOne({ _id });
  },

  async removeFavorite(userId: string, contentId: string) {
    const users = await getUsersCollection();
    const _id = toObjectId(userId);

    if (!_id) {
      return null;
    }

    await users.updateOne(
      { _id },
      {
        $pull: { favorites: { contentId } },
        $set: { updatedAt: new Date() },
      },
    );

    return users.findOne({ _id });
  },
};
