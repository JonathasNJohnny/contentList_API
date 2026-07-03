import { ObjectId } from "mongodb";

import { getMongoDb } from "../../infra/database/mongoClient";
import { User } from "../../models/User";
import { AppError } from "../../shared/errors/AppError";

const collectionName = "users";

async function getUsersCollection() {
  const db = await getMongoDb();

  if (!db) {
    throw new AppError("MongoDB is not configured or unavailable.", 503);
  }

  return db.collection<User>(collectionName);
}

export const authRepository = {
  async findByEmail(email: string) {
    const users = await getUsersCollection();

    return users.findOne({ email });
  },

  async findByNormalizedName(normalizedName: string) {
    const users = await getUsersCollection();

    return users.findOne({ normalizedName });
  },

  async findAll() {
    const users = await getUsersCollection();

    return users.find().toArray();
  },

  async findById(id: string) {
    const users = await getUsersCollection();

    if (!ObjectId.isValid(id)) {
      return null;
    }

    return users.findOne({ _id: new ObjectId(id) });
  },

  async findByName(name: string) {
    const users = await getUsersCollection();

    return users.findOne({ normalizedName: name });
  },

  async updateNameById(id: string, name: string, normalizedName: string) {
    const users = await getUsersCollection();

    if (!ObjectId.isValid(id)) {
      return null;
    }

    await users.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name,
          normalizedName,
          updatedAt: new Date(),
        },
      },
    );

    return users.findOne({
      _id: new ObjectId(id),
    });
  },

  // async updateEmailVerificationCodeById(
  //   id: ObjectId,
  //   code: string,
  //   expiresAt: Date,
  // ) {
  //   const users = await getUsersCollection();

  //   await users.updateOne(
  //     { _id: id },
  //     {
  //       $set: {
  //         verificationCode: code,
  //         verificationCodeExpiresAt: expiresAt,
  //       },
  //     },
  //   );
  // },

  async create(user: User) {
    const users = await getUsersCollection();
    const result = await users.insertOne(user);

    return {
      ...user,
      _id: result.insertedId,
    };
  },

  async markEmailAsVerified(id: ObjectId) {
    const users = await getUsersCollection();
    const now = new Date();

    await users.updateOne(
      { _id: id },
      {
        $set: {
          emailVerified: true,
          updatedAt: now,
        },
        $unset: {
          verificationCode: "",
          verificationCodeExpiresAt: "",
        },
      },
    );
  },
};
