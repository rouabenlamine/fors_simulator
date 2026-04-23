import { SessionOptions } from "iron-session";
import type { User } from "./types";

export interface SessionData {
  user?: User;
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "complex-password-at-least-32-characters-long!!",
  cookieName: "fors-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
  },
};
