import { Favorite, FavoriteStatus, toPublicUser } from "../../models/User";
import { AppError } from "../../shared/errors/AppError";
import { favoriteRepository } from "./favorite.repository";

const favoriteStatuses = new Set<FavoriteStatus>([
  "watching",
  "watch",
  "watched",
]);

type AddFavoriteInput = {
  contentId?: unknown;
  name?: unknown;
  contentType?: unknown;
  photoUrl?: unknown;
  status?: unknown;
  userRating?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  moment?: unknown;
  comment?: unknown;
};

type UpdateFavoriteInput = Partial<AddFavoriteInput>;

type ListFavoriteFilters = {
  contentType?: unknown;
  status?: unknown;
};

function normalizeString(value: unknown) {
  return String(value ?? "").trim();
}

function ensureRequired(value: string, field: string) {
  if (!value) {
    throw new AppError(`${field} e obrigatorio.`, 400);
  }
}

function normalizeStatus(value: unknown): FavoriteStatus {
  const status = normalizeString(value) as FavoriteStatus;

  if (!favoriteStatuses.has(status)) {
    throw new AppError("Status invalido.", 400);
  }

  return status;
}

function normalizeOptionalRating(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const rating = Number(value);

  if (!Number.isFinite(rating) || rating < 0 || rating > 100) {
    throw new AppError("userRating deve estar entre 0 e 100.", 400);
  }

  return rating;
}

function normalizeOptionalNumber(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new AppError(`${field} deve ser numerico.`, 400);
  }

  return number;
}

function normalizeOptionalString(value: unknown) {
  if (value === undefined || value === null) {
    return value as undefined | null;
  }

  return String(value).trim();
}

function setIfDefined<T extends object, K extends keyof T>(
  target: T,
  key: K,
  value: T[K] | undefined,
) {
  if (value !== undefined) {
    target[key] = value;
  }
}

function findFavorite(favorites: Favorite[], contentId: string) {
  return favorites.find((favorite) => favorite.contentId === contentId);
}

export const favoriteService = {
  async list(userId: string, filters: ListFavoriteFilters) {
    const user = await favoriteRepository.findUserById(userId);

    if (!user) {
      throw new AppError("Usuario nao encontrado.", 404);
    }

    const contentType = normalizeString(filters.contentType);
    const status =
      filters.status === undefined
        ? undefined
        : normalizeStatus(filters.status);

    return (user.favorites ?? []).filter((favorite) => {
      if (contentType && favorite.contentType !== contentType) {
        return false;
      }

      if (status && favorite.status !== status) {
        return false;
      }

      return true;
    });
  },

  async add(userId: string, input: AddFavoriteInput) {
    const contentId = normalizeString(input.contentId);
    const name = normalizeString(input.name);
    const contentType = normalizeString(input.contentType);
    const status = normalizeStatus(input.status);

    ensureRequired(contentId, "contentId");
    ensureRequired(name, "name");
    ensureRequired(contentType, "contentType");

    const user = await favoriteRepository.findUserById(userId);

    if (!user) {
      throw new AppError("Usuario nao encontrado.", 404);
    }

    if (findFavorite(user.favorites ?? [], contentId)) {
      throw new AppError("Favorito ja cadastrado para este usuario.", 409);
    }

    const favorite: Favorite = {
      contentId,
      name,
      contentType,
      status,
    };
    const userRating = normalizeOptionalRating(input.userRating);
    const startDate = normalizeOptionalString(input.startDate);
    const endDate = normalizeOptionalString(input.endDate);
    const moment = normalizeOptionalNumber(input.moment, "moment");
    const comment = normalizeOptionalString(input.comment);
    const photoUrl = normalizeOptionalString(input.photoUrl);

    setIfDefined(favorite, "photoUrl", photoUrl ?? undefined);
    setIfDefined(favorite, "userRating", userRating);
    setIfDefined(favorite, "startDate", startDate);
    setIfDefined(favorite, "endDate", endDate);
    setIfDefined(favorite, "moment", moment);
    setIfDefined(favorite, "comment", comment ?? undefined);

    const updatedUser = await favoriteRepository.addFavorite(userId, favorite);

    if (!updatedUser) {
      throw new AppError("Usuario nao encontrado.", 404);
    }

    return toPublicUser(updatedUser);
  },

  async update(userId: string, contentId: string, input: UpdateFavoriteInput) {
    const normalizedContentId = normalizeString(contentId);

    ensureRequired(normalizedContentId, "contentId");

    const user = await favoriteRepository.findUserById(userId);

    if (!user) {
      throw new AppError("Usuario nao encontrado.", 404);
    }

    if (!findFavorite(user.favorites ?? [], normalizedContentId)) {
      throw new AppError("Favorito nao encontrado.", 404);
    }

    const data: Partial<Favorite> = {};

    if (input.name !== undefined) {
      data.name = normalizeString(input.name);
      ensureRequired(data.name, "name");
    }
    if (input.contentType !== undefined) {
      data.contentType = normalizeString(input.contentType);
      ensureRequired(data.contentType, "contentType");
    }
    if (input.photoUrl !== undefined) {
      setIfDefined(
        data,
        "photoUrl",
        normalizeOptionalString(input.photoUrl) ?? undefined,
      );
    }
    if (input.status !== undefined) data.status = normalizeStatus(input.status);
    if (input.userRating !== undefined) {
      setIfDefined(
        data,
        "userRating",
        normalizeOptionalRating(input.userRating),
      );
    }
    if (input.startDate !== undefined) {
      setIfDefined(data, "startDate", normalizeOptionalString(input.startDate));
    }
    if (input.endDate !== undefined) {
      setIfDefined(data, "endDate", normalizeOptionalString(input.endDate));
    }
    if (input.moment !== undefined) {
      setIfDefined(
        data,
        "moment",
        normalizeOptionalNumber(input.moment, "moment"),
      );
    }
    if (input.comment !== undefined) {
      setIfDefined(
        data,
        "comment",
        normalizeOptionalString(input.comment) ?? undefined,
      );
    }

    const updatedUser = await favoriteRepository.updateFavorite(
      userId,
      normalizedContentId,
      data,
    );

    if (!updatedUser) {
      throw new AppError("Usuario nao encontrado.", 404);
    }

    const favorite = findFavorite(
      updatedUser.favorites ?? [],
      normalizedContentId,
    );

    if (!favorite) {
      throw new AppError("Favorito nao encontrado.", 404);
    }

    return favorite;
  },

  async remove(userId: string, contentId: string) {
    const normalizedContentId = normalizeString(contentId);

    ensureRequired(normalizedContentId, "contentId");

    const user = await favoriteRepository.findUserById(userId);

    if (!user) {
      throw new AppError("Usuario nao encontrado.", 404);
    }

    if (!findFavorite(user.favorites ?? [], normalizedContentId)) {
      throw new AppError("Favorito nao encontrado.", 404);
    }

    const updatedUser = await favoriteRepository.removeFavorite(
      userId,
      normalizedContentId,
    );

    if (!updatedUser) {
      throw new AppError("Usuario nao encontrado.", 404);
    }

    return { message: "Favorito removido com sucesso." };
  },
};
