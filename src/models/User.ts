import { ObjectId } from "mongodb";

export type Favorite = {
  contentId: string;
  name: string;
  contentType: string;
  userRating?: number;
  startDate?: string;
  endDate?: string;
  comment?: string;
};

export type User = {
  _id?: ObjectId;
  name: string;
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

export function toPublicUser(user: User): PublicUser {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    favorites: user.favorites,
  };
}
