import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "./lib/session-config";
import type { SessionData } from "./lib/session-config";
import type { UserRole } from "./lib/types";

const PUBLIC_PATHS = ["/login", "/admin/login", "/fors/auth/login", "/fors/auth/logout", "/api/tickets", "/api/analyze", "/api/ai-analysis", "/api/migrate"];

// New updated VALID_ROLES include admin and superadmin
const VALID_ROLES = ["agent", "reporter", "manager", "admin", "superadmin", "user", "it_support", "it_report", "it_manager"];

// Default homes based on role — Updated: IT Manager goes to activity (not tables)
const ROLE_HOME: Record<string, string> = {
  agent: "/tickets",
  reporter: "/report",
  manager: "/activity",
  admin: "/admin/dashboard",
  superadmin: "/superadmin/dashboard",
  user: "/tickets",
  it_support: "/tickets",
  it_report: "/report",
  it_manager: "/activity"
};

const RESTRICTED: { prefix: string; roles: string[] }[] = [
  { prefix: "/report", roles: ["reporter", "it_report"] },
  { prefix: "/tables", roles: ["admin", "superadmin"] },
  { prefix: "/database", roles: ["manager", "it_manager", "agent", "superadmin"] },
  { prefix: "/users", roles: ["manager", "it_manager", "admin", "superadmin"] },
  { prefix: "/kpi-config", roles: ["manager", "it_manager", "admin", "superadmin"] },
  { prefix: "/admin/view-control", roles: ["admin", "superadmin"] },
];

const AGENT_ONLY_PREFIXES = ["/tickets", "/analysis", "/lab", "/chat"];

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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("fors-token")?.value;
  if (!token) {
    // If trying to access admin/superadmin routes without auth, redirect to admin login
    if (pathname.startsWith("/admin") || pathname.startsWith("/superadmin")) {
      return redirectToAdminLogin(req);
    }
    return redirectToLogin(req);
  }

  const res = NextResponse.next();
  let session: any;

  try {
    session = await getIronSession<SessionData>(req, res, sessionOptions);
  } catch {
    return redirectToLogin(req);
  }

  if (!session.isLoggedIn || !session.user) {
    // If trying to access admin/superadmin routes without session, redirect to admin login
    if (pathname.startsWith("/admin") || pathname.startsWith("/superadmin")) {
      return redirectToAdminLogin(req);
    }
    return redirectToLogin(req);
  }

  const role = session.user.role as string;

  // Admin access validation
  if (pathname.startsWith("/admin") && !["admin", "superadmin"].includes(role)) {
    const url = req.nextUrl.clone();
    url.pathname = ROLE_HOME[role] || "/tickets";
    return NextResponse.redirect(url);
  }

  // Superadmin access validation
  if (pathname.startsWith("/superadmin") && role !== "superadmin") {
    const url = req.nextUrl.clone();
    // Redirect Admins trying to reach superadmin back to admin
    url.pathname = role === "admin" ? "/admin/dashboard" : (ROLE_HOME[role] || "/tickets");
    return NextResponse.redirect(url);
  }

  // General Role-Based Routing
  for (const { prefix, roles } of RESTRICTED) {
    if (pathname.startsWith(prefix) && !roles.includes(role)) {
      const url = req.nextUrl.clone();
      url.pathname = ROLE_HOME[role] || "/tickets";
      return NextResponse.redirect(url);
    }
  }

  if (AGENT_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (["reporter", "manager", "it_report", "it_manager"].includes(role)) {
      const url = req.nextUrl.clone();
      url.pathname = ROLE_HOME[role] || "/tickets";
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
