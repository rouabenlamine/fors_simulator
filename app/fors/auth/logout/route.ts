import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("fors-token")?.value;
    
    if (token) {
      // Log logout
      const sessions = await query<any>("SELECT user_matricule FROM sessions WHERE token = ?", [token]);
      if (sessions.length > 0) {
        const userMatricule = sessions[0].user_matricule;
        await query(
          "INSERT INTO audit_logs (user_matricule, action, details) VALUES (?, ?, ?)",
          [userMatricule, "LOGOUT", JSON.stringify({ message: `User ${userMatricule} logged out`, timestamp: new Date().toISOString() })]
        );
      }
      // Delete server-side session
      await query("DELETE FROM sessions WHERE token = ?", [token]);
    }

    // Clear cookie
    const cookieStoreWrite = await cookies();
    cookieStoreWrite.delete("fors-token");
    cookieStoreWrite.delete("fors-session");
  } catch (e) {
    console.error("[Logout] Error during cleanup:", e);
  }

  return NextResponse.json({ ok: true });
}
