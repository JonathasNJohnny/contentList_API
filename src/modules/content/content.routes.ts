import { Router } from "express";

import { contentController } from "./content.controller";

const contentRoutes = Router();

contentRoutes.get(
  "/:category/search/:page",
  contentController.searchByCategory,
);
contentRoutes.get("/:category/:page", contentController.showByCategory);

export { contentRoutes };
