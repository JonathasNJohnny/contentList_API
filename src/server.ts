import "dotenv/config";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");
import app from "./app";
import { env } from "./config/env";
import { runMigrations } from "./migrations";

runMigrations()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to run migrations.", error);
    process.exit(1);
  });
