import { Router } from "express";

import { authenticate } from "../../middlewares/authenticate";
import { authController } from "./auth.controller";

const authRoutes = Router();

authRoutes.post("/register", authController.register);
authRoutes.post("/verify-email", authController.verifyEmail);
authRoutes.post("/login", authController.login);
authRoutes.get("/me", authenticate, authController.me);
authRoutes.put("/me/name", authenticate, authController.updateName);
authRoutes.get("/other/user", authController.getAllUsers);
authRoutes.get("/other/user/:name", authController.getUserByName);

export { authRoutes };
