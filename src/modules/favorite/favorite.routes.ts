import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate";
import { favoriteController } from "./favorite.controller";

const favoriteRoutes = Router();

favoriteRoutes.get("/", authenticate, favoriteController.list);
favoriteRoutes.post("/", authenticate, favoriteController.add);
favoriteRoutes.patch("/:contentId", authenticate, favoriteController.update);
favoriteRoutes.delete("/:contentId", authenticate, favoriteController.remove);

export { favoriteRoutes };
