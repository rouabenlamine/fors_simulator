import { SessionOptions } from "iron-session";
import type { User } from "./types";

export interface SessionData {
  user?: User;
  isLoggedIn: boolean;
  expiresAt?: string;
}

/**
 * All possible role groups for multi-session support.
 * Each group gets its own cookie pair (fors-token-{group} + fors-session-{group}).
 */
export type SessionGroup = "it_support" | "it_manager" | "it_report" | "admin" | "superadmin";

const ROLE_TO_GROUP: Record<string, SessionGroup> = {
  it_support: "it_support",
  it_manager: "it_manager",
  it_report: "it_report",
  user: "it_report",
  admin: "admin",
  superadmin: "superadmin",
};

/** Map a user role to its session group key */
export function getSessionGroup(role: string): SessionGroup {
  return ROLE_TO_GROUP[role] || "it_support";
}

/** Cookie name for the DB-backed session token for a given group */
export function getTokenCookieName(group: SessionGroup, matricule?: string): string {
  return matricule ? `fors-token-${group}-${matricule}` : `fors-token-${group}`;
}

/** Iron-session cookie name for a given group */
export function getIronCookieName(group: SessionGroup, matricule?: string): string {
  return matricule ? `fors-session-${group}-${matricule}` : `fors-session-${group}`;
}

/** Build iron-session options for a specific session group */
export function getSessionOptions(group: SessionGroup, matricule?: string): SessionOptions {
  return {
    password: process.env.SESSION_SECRET || "complex-password-at-least-32-characters-long!!",
    cookieName: getIronCookieName(group, matricule),
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 8,
    },
  };
}

/** All session groups — ordered with admin/superadmin FIRST to prevent it_support from winning */
export const ALL_SESSION_GROUPS: SessionGroup[] = [
  "superadmin", "admin", "it_manager", "it_report", "it_support",
];

/**
 * Determine which session group to use based on URL path.
 * Returns null when the path doesn't clearly map to a single group
 * (the caller should then try all groups).
 */
export function getSessionGroupFromPath(pathname: string): SessionGroup | null {
  if (pathname.startsWith("/superadmin")) return "superadmin";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/tickets") || pathname.startsWith("/chat") || pathname.startsWith("/analysis") || pathname.startsWith("/lab")) return "it_support";
  if (pathname.startsWith("/report")) return "it_report";
  if (pathname.startsWith("/activity") || pathname.startsWith("/users") || pathname.startsWith("/kpi-config")) return "it_manager";
  // Database is accessible to multiple roles
  if (pathname.startsWith("/database")) return null;
  return null;
}

/**
 * Returns the STRICT list of session groups to try for a given path.
 *
 * CRITICAL DESIGN: For paths that map to a SINGLE role (like /superadmin/*),
 * we return ONLY that group (plus admin for superadmin paths, since superadmin
 * can access admin routes). This prevents an it_support cookie from ever
 * being picked up on a superadmin page.
 *
 * For shared/ambiguous paths, admin & superadmin groups are always tried FIRST
 * so they take priority over it_support.
 */
export function getOrderedGroupsFromPath(pathname: string): SessionGroup[] {
  if (pathname.startsWith("/superadmin")) {
    return ["superadmin"];
  }
  if (pathname.startsWith("/admin")) {
    // Try admin first — prevents superadmin cookie from hijacking admin sessions
    return ["admin", "superadmin"];
  }
  if (pathname.startsWith("/tickets") || pathname.startsWith("/chat") || pathname.startsWith("/analysis") || pathname.startsWith("/lab")) {
    return ["it_support", "it_manager", "it_report", "admin", "superadmin"];
  }
  if (pathname.startsWith("/report")) {
    return ["it_report", "admin", "superadmin"];
  }
  if (pathname.startsWith("/manager")) {
    return ["it_manager", "admin", "superadmin"];
  }
  if (pathname.startsWith("/activity")) {
    return ["it_manager", "admin", "superadmin"];
  }
  if (pathname.startsWith("/users") || pathname.startsWith("/kpi-config")) {
    return ["it_manager", "admin", "superadmin"];
  }
  // /kpis is shared — try operational roles FIRST so a manager/support user
  // with a stale superadmin cookie still sees their own view, not the superadmin one.
  if (pathname.startsWith("/kpis")) {
    return ["it_manager", "it_support", "it_report", "admin", "superadmin"];
  }

  // All other shared paths — operational roles first, then admin
  return ["it_manager", "it_support", "it_report", "admin", "superadmin"];
}

// Legacy exports for backward compatibility during migration
export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "complex-password-at-least-32-characters-long!!",
  cookieName: "fors-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 8,
  },
};
