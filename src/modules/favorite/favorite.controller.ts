import { Request, Response } from "express";

import { AppError } from "../../shared/errors/AppError";
import { favoriteService } from "./favorite.service";

function getAuthenticatedUserId(request: Request) {
  if (!request.user) {
    throw new AppError("Usuario nao autenticado.", 401);
  }

  return request.user.id;
}

function getContentIdParam(request: Request) {
  const contentId = request.params.contentId;

  return Array.isArray(contentId) ? contentId[0] : contentId;
}

export const favoriteController = {
  async list(request: Request, response: Response) {
    const favorites = await favoriteService.list(getAuthenticatedUserId(request), {
      contentType: request.query.contentType,
      status: request.query.status,
    });

    response.json({ favorites });
  },

  async add(request: Request, response: Response) {
    const user = await favoriteService.add(
      getAuthenticatedUserId(request),
      request.body,
    );

    response.status(201).json({ user });
  },

  async update(request: Request, response: Response) {
    const favorite = await favoriteService.update(
      getAuthenticatedUserId(request),
      getContentIdParam(request),
      request.body,
    );

    response.json({ favorite });
  },

  async remove(request: Request, response: Response) {
    const result = await favoriteService.remove(
      getAuthenticatedUserId(request),
      getContentIdParam(request),
    );

    response.json(result);
  },
};
