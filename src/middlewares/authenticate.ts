import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { AppError } from "../shared/errors/AppError";
import { AuthenticatedUser } from "../modules/auth/auth.types";

type JwtPayload = {
  sub?: string;
  email?: string;
};

export function authenticate(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  const authorization = request.headers.authorization;

  if (!authorization) {
    throw new AppError("Token nao informado.", 401);
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError("Formato do token invalido.", 401);
  }

  if (!env.jwtSecret) {
    throw new AppError("Configure JWT_SECRET.", 503);
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;

    if (!payload.sub || !payload.email) {
      throw new AppError("Token invalido.", 401);
    }

    request.user = {
      id: payload.sub,
      email: payload.email,
    } satisfies AuthenticatedUser;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Token invalido.", 401);
  }
}
