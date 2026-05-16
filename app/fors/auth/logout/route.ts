import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { getIronSession } from "iron-session";
import {
  ALL_SESSION_GROUPS,
  getTokenCookieName,
  getSessionOptions,
  getSessionGroup,
} from "@/lib/session-config";
import type { SessionData, SessionGroup } from "@/lib/session-config";

export async function POST(req: NextRequest) {
  try {
    // Allow callers to specify which role to log out via ?role=...
    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("role");

    const cookieStore = await cookies();

    // Determine which groups to clear
    const groupsToClear: SessionGroup[] = roleParam
      ? [getSessionGroup(roleParam)]
      : ALL_SESSION_GROUPS;

    for (const group of groupsToClear) {
      const tokenName = getTokenCookieName(group);
      const token = cookieStore.get(tokenName)?.value;

      if (token) {
        // Log logout
        const sessions = await query<any>("SELECT user_matricule FROM sessions WHERE token = ?", [token]);
        if (sessions.length > 0) {
          const userMatricule = sessions[0].user_matricule;
          await query(
            "INSERT INTO audit_logs (user_matricule, action, details) VALUES (?, ?, ?)",
            [userMatricule, "LOGOUT", JSON.stringify({ message: `User ${userMatricule} logged out (${group})`, timestamp: new Date().toISOString() })]
          );
        }
        // Delete server-side session
        await query("DELETE FROM sessions WHERE token = ?", [token]);

        // Clear iron session for this group
        try {
          const opts = getSessionOptions(group);
          const session = await getIronSession<SessionData>(cookieStore, opts);
          session.isLoggedIn = false;
          session.user = undefined;
          await session.save();
        } catch (e) { }

        cookieStore.delete(tokenName);
      }
    }

    // Also clear legacy cookies
    try {
      const legacyToken = cookieStore.get("fors-token")?.value;
      if (legacyToken) {
        await query("DELETE FROM sessions WHERE token = ?", [legacyToken]);
      }
      cookieStore.delete("fors-token");
      cookieStore.delete("fors-session");
    } catch (e) { }
  } catch (e) {
    console.error("[Logout] Error during cleanup:", e);
  }

  return NextResponse.json({ ok: true });
}
