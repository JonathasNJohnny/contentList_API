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
];

export async function runMigrations() {
  for (const migration of migrations) {
    await migration.up();
    console.log(`Migration executed: ${migration.name}`);
  }
}
