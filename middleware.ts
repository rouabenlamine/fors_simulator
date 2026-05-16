import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import {
  getSessionGroupFromPath,
  getOrderedGroupsFromPath,
  getTokenCookieName,
  getSessionOptions,
  getSessionGroup,
  ALL_SESSION_GROUPS,
} from "./lib/session-config";
import type { SessionData, SessionGroup } from "./lib/session-config";
import type { UserRole } from "./lib/types";

const PUBLIC_PATHS = ["/login", "/admin/login", "/fors/auth/login", "/fors/auth/logout", "/api/tickets", "/api/analyze", "/api/ai-analysis", "/api/migrate"];

const VALID_ROLES = ["admin", "superadmin", "it_support", "it_report", "it_manager"];

const ROLE_HOME: Record<string, string> = {
  admin: "/admin/dashboard",
  superadmin: "/superadmin/dashboard",
  it_support: "/tickets",
  it_report: "/report",
  it_manager: "/activity",
};

const RESTRICTED: { prefix: string; roles: string[] }[] = [
  { prefix: "/report", roles: ["it_report"] },
  { prefix: "/tables", roles: ["admin", "superadmin"] },
  { prefix: "/database", roles: ["it_manager", "it_support", "admin", "superadmin"] },
  { prefix: "/users", roles: ["it_manager", "admin", "superadmin"] },
  { prefix: "/kpi-config", roles: ["it_manager", "admin", "superadmin"] },
  { prefix: "/admin/view-control", roles: ["admin", "superadmin"] },
  { prefix: "/admin/audit", roles: ["admin", "superadmin"] },
];

const AGENT_ONLY_PREFIXES = ["/tickets", "/analysis", "/lab"];

/** Redirect non-admin users to /login */
function redirectToLogin(req: NextRequest): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

/** Redirect admin/superadmin users to /admin/login */
function redirectToAdminLogin(req: NextRequest): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  return NextResponse.redirect(url);
}

/**
 * Try to resolve a valid session from role-scoped cookies.
 * Returns the session and its group, or null if none found.
 */
async function resolveSession(
  req: NextRequest,
  res: NextResponse,
  pathname: string,
  sid?: string
): Promise<{ session: SessionData; group: SessionGroup } | null> {
  const groupsToTry = getOrderedGroupsFromPath(pathname);

  for (const group of groupsToTry) {
    const tokenName = getTokenCookieName(group, sid);
    const token = req.cookies.get(tokenName)?.value;
    if (!token) continue;

    try {
      const opts = getSessionOptions(group, sid);
      const session = await getIronSession<SessionData>(req, res, opts);
      if (session.isLoggedIn && session.user) {
        // Check expiration
        if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
          continue;
        }

        // Validate role matches group
        const userGroup = getSessionGroup(session.user.role);
        if (userGroup !== group) continue;

        // If sid was provided in path, it MUST match the session user
        if (sid && session.user.matricule !== sid) continue;

        return { session, group };
      }
    } catch { }
  }
  return null;
}

const RESERVED_PATH_ROOTS = ["admin", "superadmin", "it_support", "it_report", "it_manager", "login", "api", "fors", "_next", "favicon.ico"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 1. Parse Path for Matricule (SID)
  const parts = pathname.split('/').filter(Boolean);
  const isSidPath = parts[0] === 's' && parts[1];
  const sid = isSidPath ? parts[1] : undefined;
  const effectivePathname = isSidPath ? '/' + parts.slice(2).join('/') : pathname;

  // 2. Resolve Session
  // Try with sid if present, otherwise try legacy/general
  let resolved = await resolveSession(req, res, effectivePathname, sid);

  if (!resolved && !isSidPath) {
    // If no SID in path, try finding ANY active session to redirect
    // We look for cookies that start with 'fors-token-'
    const allCookies = req.cookies.getAll();
    const tokenCookies = allCookies.filter(c => c.name.startsWith('fors-token-'));
    for (const cookie of tokenCookies) {
      // Extract group and sid from cookie name: fors-token-{group}-{sid}
      // e.g. "fors-token-it_support-123-456" -> group="it_support", sid="123-456"
      const parts = cookie.name.split('-');
      if (parts.length < 3) continue;

      const group = parts[2] as SessionGroup;
      // The rest of the parts (if any) are the SID
      const sidFromCookie = parts.slice(3).join('-');

      if (group && ALL_SESSION_GROUPS.includes(group)) {
        resolved = await resolveSession(req, res, pathname, sidFromCookie || undefined);
        if (resolved) break;
      }
    }

    if (resolved && resolved.session.user) {
      const url = req.nextUrl.clone();
      url.pathname = `/s/${resolved.session.user.matricule}${pathname}`;
      return NextResponse.redirect(url);
    }
  }

  // 3. Handle Unauthorized
  if (!resolved) {
    const isAdminPath = effectivePathname.startsWith("/admin") || effectivePathname.startsWith("/superadmin");
    if (isAdminPath) return redirectToAdminLogin(req);
    return redirectToLogin(req);
  }

  // 4. Force SID path if missing
  if (!isSidPath && resolved.session.user) {
    const url = req.nextUrl.clone();
    url.pathname = `/s/${resolved.session.user.matricule}${pathname}`;
    return NextResponse.redirect(url);
  }

  const { session } = resolved;
  const role = session.user!.role as string;
  const userMatricule = session.user!.matricule;

  // 5. Cross-User Protection: SID in path MUST match logged in user
  if (isSidPath && sid !== userMatricule) {
    const url = req.nextUrl.clone();
    url.pathname = `/s/${userMatricule}${effectivePathname}`;
    return NextResponse.redirect(url);
  }

  // 6. Role-Based Access Validation (on effectivePathname)
  if (effectivePathname.startsWith("/admin") && !["admin", "superadmin"].includes(role)) {
    const url = req.nextUrl.clone();
    url.pathname = `/s/${userMatricule}${ROLE_HOME[role] || "/tickets"}`;
    return NextResponse.redirect(url);
  }

  if (effectivePathname.startsWith("/superadmin") && role !== "superadmin") {
    const url = req.nextUrl.clone();
    const target = role === "admin" ? "/admin/dashboard" : (ROLE_HOME[role] || "/tickets");
    url.pathname = `/s/${userMatricule}${target}`;
    return NextResponse.redirect(url);
  }

  for (const { prefix, roles } of RESTRICTED) {
    if (effectivePathname.startsWith(prefix) && !roles.includes(role)) {
      const url = req.nextUrl.clone();
      url.pathname = `/s/${userMatricule}${ROLE_HOME[role] || "/tickets"}`;
      return NextResponse.redirect(url);
    }
  }

  if (AGENT_ONLY_PREFIXES.some((p) => effectivePathname.startsWith(p))) {
    if (["it_report", "it_manager"].includes(role)) {
      const url = req.nextUrl.clone();
      url.pathname = `/s/${userMatricule}${ROLE_HOME[role] || "/tickets"}`;
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
