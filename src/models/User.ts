import { ObjectId } from "mongodb";

export type Favorite = {
  contentId: string;
  name: string;
  contentType: string;
  photoUrl?: string;
  status: FavoriteStatus;
  userRating?: number;
  startDate?: string | null;
  endDate?: string | null;
  moment?: number;
  comment?: string;
};

export type FavoriteStatus = "watching" | "watch" | "watched";

export type User = {
  _id?: ObjectId;
  name: string;
  normalizedName: string;
  email: string;
  password: string;
  emailVerified: boolean;
  verificationCode?: string;
  verificationCodeExpiresAt?: Date;
  favorites: Favorite[];
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  favorites: Favorite[];
};

export type generalUser = {
  name: string;
  favorites: Favorite[];
};

export type searchUser = {
  name: string;
};

export function toPublicUser(user: User): PublicUser {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    favorites: user.favorites ?? [],
  };
}

export function toGeneralUser(user: User): generalUser {
  return {
    name: user.name,
    favorites: user.favorites ?? [],
  };
}

export function toSearchUser(user: User): searchUser {
  return {
    name: user.name,
  };
}
