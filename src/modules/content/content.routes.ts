import { Router } from "express";

import { contentController } from "./content.controller";

const contentRoutes = Router();

contentRoutes.get("/", contentController.index);
contentRoutes.get("/:category", contentController.showByCategory);
contentRoutes.get("/:category/:page", contentController.showByCategory);

export { contentRoutes };
