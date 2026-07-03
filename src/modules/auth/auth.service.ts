import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { MongoServerError } from "mongodb";

import { env } from "../../config/env";
import {
  PublicUser,
  toGeneralUser,
  toPublicUser,
  toSearchUser,
  User,
} from "../../models/User";
import { AppError } from "../../shared/errors/AppError";
import { sendVerificationEmail } from "../../utils/email";
import { authRepository } from "./auth.repository";
import { LoginInput, RegisterInput, VerifyEmailInput } from "./auth.types";

const saltRounds = 10;
const verificationCodeTtlMs = 15 * 60 * 1000;
const userNamePattern = /^[a-z0-9._]+$/;

function normalizeString(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeEmail(value: unknown) {
  return normalizeString(value).toLowerCase();
}

function normalizeName(value: unknown) {
  return normalizeString(value);
}

function toNormalizedName(name: string) {
  return name.toLowerCase();
}

function ensureRequired(value: string, field: string) {
  if (!value) {
    throw new AppError(`${field} e obrigatorio.`, 400);
  }
}

function validateUserName(value: unknown) {
  const name = normalizeName(value);

  if (!name) {
    throw new AppError("Name is required.", 400);
  }

  if (name.length < 2) {
    throw new AppError("Name must have at least 2 characters.", 400);
  }

  if (name.length > 30) {
    throw new AppError("Name must have at most 30 characters.", 400);
  }

  if (/\s/.test(name)) {
    throw new AppError("Name cannot contain spaces.", 400);
  }

  if (!userNamePattern.test(name)) {
    throw new AppError(
      'Name can only contain letters, numbers, "." and "_", and cannot contain spaces.',
      400,
    );
  }

  return name;
}

function isDuplicateKeyError(error: unknown, key: string) {
  return (
    error instanceof MongoServerError &&
    error.code === 11000 &&
    Boolean(error.keyPattern?.[key])
  );
}

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function signToken(user: User) {
  if (!env.jwtSecret) {
    throw new AppError("Configure JWT_SECRET.", 503);
  }

  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign(
    {
      sub: String(user._id),
      email: user.email,
    },
    env.jwtSecret,
    options,
  );
}

export const authService = {
  async register(input: RegisterInput): Promise<PublicUser> {
    const name = validateUserName(input.name);
    const normalizedName = toNormalizedName(name);
    const email = normalizeEmail(input.email);
    const password = normalizeString(input.password);

    ensureRequired(email, "email");
    ensureRequired(password, "password");

    const existingUser = await authRepository.findByEmail(email);

    if (existingUser) {
      throw new AppError("Email ja cadastrado.", 409);
    }

    const existingName =
      await authRepository.findByNormalizedName(normalizedName);

    if (existingName) {
      throw new AppError("Name already in use.", 409);
    }

    const now = new Date();
    const verificationCode = generateVerificationCode();
    let user: User;

    try {
      user = await authRepository.create({
        name,
        normalizedName,
        email,
        password: await bcrypt.hash(password, saltRounds),
        emailVerified: false,
        verificationCode,
        verificationCodeExpiresAt: new Date(
          now.getTime() + verificationCodeTtlMs,
        ),
        favorites: [],
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      if (isDuplicateKeyError(error, "normalizedName")) {
        throw new AppError("Name already in use.", 409);
      }

      throw error;
    }

    await sendVerificationEmail({
      to: email,
      name,
      code: verificationCode,
    });

    return toPublicUser(user);
  },

  async verifyEmail(input: VerifyEmailInput) {
    const email = normalizeEmail(input.email);
    const code = normalizeString(input.code);

    ensureRequired(email, "email");
    ensureRequired(code, "code");

    const user = await authRepository.findByEmail(email);

    if (!user || !user._id) {
      throw new AppError("Usuario nao encontrado.", 404);
    }

    if (user.emailVerified) {
      return { message: "Email ja verificado." };
    }

    if (!user.verificationCode || user.verificationCode !== code) {
      throw new AppError("Codigo de verificacao invalido.", 400);
    }

    if (
      !user.verificationCodeExpiresAt ||
      user.verificationCodeExpiresAt.getTime() < Date.now()
    ) {
      throw new AppError("Codigo de verificacao expirado.", 400);
    }

    await authRepository.markEmailAsVerified(user._id);

    return { message: "Email verificado com sucesso." };
  },

  async login(input: LoginInput) {
    const email = normalizeEmail(input.email);
    const password = normalizeString(input.password);

    ensureRequired(email, "email");
    ensureRequired(password, "password");

    const user = await authRepository.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError("Email ou password invalidos.", 401);
    }

    if (!user.emailVerified) {
      throw new AppError("Email ainda nao verificado.", 403);
    }

    return {
      token: signToken(user),
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
      },
    };
  },

  async me(userId: string) {
    const user = await authRepository.findById(userId);

    if (!user) {
      throw new AppError("Usuario nao encontrado.", 404);
    }

    return toPublicUser(user);
  },

  async updateName(userId: string, inputName: unknown) {
    const name = validateUserName(inputName);
    const normalizedName = toNormalizedName(name);

    const existingName =
      await authRepository.findByNormalizedName(normalizedName);

    if (existingName && String(existingName._id) !== userId) {
      throw new AppError("Name already in use.", 409);
    }

    let user: User | null;

    try {
      user = await authRepository.updateNameById(userId, name, normalizedName);
    } catch (error) {
      if (isDuplicateKeyError(error, "normalizedName")) {
        throw new AppError("Name already in use.", 409);
      }

      throw error;
    }

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return toPublicUser(user);
  },

  async getAllUsers() {
    const users = await authRepository.findAll();

    return users.map(toSearchUser);
  },

  async getUserByName(name: string) {
    const user = await authRepository.findByName(name.toLowerCase());

    if (!user) {
      throw new AppError("Usuario nao encontrado.", 404);
    }

    return toGeneralUser(user);
  },
};
