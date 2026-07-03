import cors from "cors";
import express, { NextFunction, Request, Response } from "express";

import "./@types/express";
import { swaggerRoutes } from "./docs/swagger.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { contentRoutes } from "./modules/content/content.routes";
import { favoriteRoutes } from "./modules/favorite/favorite.routes";
import { healthRoutes } from "./modules/health/health.routes";
import { AppError } from "./shared/errors/AppError";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_request: Request, response: Response) => {
  response.json({
    message: "ContentList API is running"
  });
});

app.use("/api/content", contentRoutes);
app.use("/api/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/favorites", favoriteRoutes);
app.use("/api", swaggerRoutes);

app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      message: error.message
    });
  }

  console.error(error);

  return response.status(500).json({
    message: "Internal server error"
  });
});

export default app;
