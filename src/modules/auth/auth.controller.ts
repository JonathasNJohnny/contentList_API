import { Request, Response } from "express";

import { AppError } from "../../shared/errors/AppError";
import { authService } from "./auth.service";

export const authController = {
  async register(request: Request, response: Response) {
    const user = await authService.register(request.body);

    response.status(201).json({ user });
  },

  async verifyEmail(request: Request, response: Response) {
    const result = await authService.verifyEmail(request.body);

    response.json(result);
  },

  async login(request: Request, response: Response) {
    const result = await authService.login(request.body);

    response.json(result);
  },

  async me(request: Request, response: Response) {
    if (!request.user) {
      throw new AppError("Usuario nao autenticado.", 401);
    }

    const user = await authService.me(request.user.id);

    response.json({ user });
  },

  async updateName(request: Request, response: Response) {
    if (!request.user) {
      throw new AppError("Usuario nao autenticado.", 401);
    }

    const { name } = request.body;

    const updatedUser = await authService.updateName(request.user.id, name);

    response.json({ user: updatedUser });
  },

  async getAllUsers(request: Request, response: Response) {
    const user = await authService.getAllUsers();

    response.json({ user });
  },

  async getUserByName(request: Request, response: Response) {
    const { name } = request.params;

    const user = await authService.getUserByName(String(name));

    response.json({ user });
  },
};
