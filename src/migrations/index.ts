import { getMongoDb } from "../infra/database/mongoClient";

type Migration = {
  name: string;
  up: () => Promise<void>;
};

const migrations: Migration[] = [
  {
    name: "001_create_unique_user_email_index",
    async up() {
      const db = await getMongoDb();

      if (!db) {
        console.warn("MongoDB not configured. Skipping migrations.");
        return;
      }

      await db.collection("users").createIndex(
        { email: 1 },
        {
          unique: true,
          name: "unique_user_email",
        },
      );
    },
  },
  {
    name: "002_create_unique_user_normalized_name_index",
    async up() {
      const db = await getMongoDb();

      if (!db) {
        console.warn("MongoDB not configured. Skipping migrations.");
        return;
      }

      const users = db.collection("users");

      await users.updateMany({ normalizedName: { $exists: false } }, [
        {
          $set: {
            normalizedName: {
              $toLower: {
                $trim: {
                  input: "$name",
                },
              },
            },
          },
        },
      ]);

      await users.createIndex(
        { normalizedName: 1 },
        {
          unique: true,
          name: "unique_user_normalized_name",
        },
      );
    },
  },
  {
    name: "003_backfill_user_pfp",
    async up() {
      const db = await getMongoDb();

      if (!db) {
        console.warn("MongoDB not configured. Skipping migrations.");
        return;
      }

      await db.collection("users").updateMany(
        {
          $or: [{ pfp: null }, { pfp: { $exists: false } }],
        },
        {
          $set: {
            pfp: "4",
          },
        },
      );
    },
  },
];

export async function runMigrations() {
  for (const migration of migrations) {
    await migration.up();
    console.log(`Migration executed: ${migration.name}`);
  }
}
