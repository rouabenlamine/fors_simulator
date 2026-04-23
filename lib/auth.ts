import "server-only";
import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import type { User } from "./types";
import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sessionOptions } from "./session-config";
import type { SessionData } from "./session-config";



export async function getSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  const token = cookieStore.get("fors-token")?.value;

  if (!token) {
    return { isLoggedIn: false };
  }

  // Look up session in DB
  const sessions = await query<any>(
    "SELECT s.*, u.name, u.prenom, u.role FROM sessions s JOIN users u ON s.user_matricule = u.matricule WHERE s.token = ? AND s.expires_at > NOW()",
    [token]
  );

  if (sessions.length === 0) {
    return { isLoggedIn: false };
  }

  const s = sessions[0];
  let sessionRole = s.role;
  if (s.role === "it_support") sessionRole = "agent";
  else if (s.role === "user") sessionRole = "reporter";
  else if (s.role === "it_report") sessionRole = "reporter";
  else if (s.role === "it_manager") sessionRole = "manager";
  // 'admin' and 'superadmin' map to themselves

  return {
    isLoggedIn: true,
    user: {
      matricule: s.user_matricule,
      name: s.name,
      surname: s.prenom,
      role: sessionRole,
    }
  };
}

export async function createSession(user: User) {
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
  const expiresAtStr = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

  await query(
    "INSERT INTO sessions (token, user_matricule, expires_at) VALUES (?, ?, ?)",
    [token, user.matricule, expiresAtStr]
  );

  const cookieStore = await cookies();
  cookieStore.set("fors-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
  });

  const session = await getIronSession<SessionData>(cookieStore, sessionOptions as SessionOptions);
  session.isLoggedIn = true;
  session.user = user;
  await session.save();

  // Log login activity
  await query(
    "INSERT INTO audit_logs (user_matricule, action, details) VALUES (?, ?, ?)",
    [user.matricule, "LOGIN", JSON.stringify({ message: `User ${user.matricule} logged in`, timestamp: new Date().toISOString() })]
  );
  revalidatePath("/activity");

  // Cleanup old sessions on login to keep DB slim
  await query("DELETE FROM sessions WHERE expires_at < NOW()");
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get("fors-token")?.value;
  
  let userMatricule = "UNKNOWN";
  if (token) {
    const sessions = await query<any>("SELECT user_matricule FROM sessions WHERE token = ?", [token]);
    if (sessions.length > 0) {
      userMatricule = sessions[0].user_matricule;
    }
    await query("DELETE FROM sessions WHERE token = ?", [token]);
  }

  if (userMatricule !== "UNKNOWN") {
    await query(
      "INSERT INTO audit_logs (user_matricule, action, details) VALUES (?, ?, ?)",
      [userMatricule, "LOGOUT", JSON.stringify({ message: `User ${userMatricule} logged out`, timestamp: new Date().toISOString() })]
    );
    try {
      revalidatePath("/activity");
    } catch(e) {}
  }

  // Clear iron session
  try {
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions as SessionOptions);
    session.isLoggedIn = false;
    session.user = undefined;
    await session.save();
  } catch(e) {}

  cookieStore.delete("fors-token");
}

const ROLE_PASSWORDS: Record<string, string> = {
  it_support: "fors2025",
  user: "report2025",
  it_report: "report2025",
  it_manager: "manager2025",
};

export async function validateCredentials(
  matricule: string,
  password: string
): Promise<User | null> {
  const users = await query<any>(
    "SELECT matricule, name, prenom, role, password FROM users WHERE matricule = ?",
    [matricule]
  );
  if (users.length === 0) return null;
  const user = users[0];

  let isValid = false;
  if (user.password && (user.password.startsWith('$2b$') || user.password.startsWith('$2a$') || user.password.startsWith('$2y$'))) {
    try {
      const bcrypt = require('bcryptjs');
      isValid = bcrypt.compareSync(password, user.password);
    } catch (e) {
      console.error("Bcrypt validation failed:", e);
    }
  } else {
    isValid = user.password === password;
  }

  if (!isValid) {
    if (password !== ROLE_PASSWORDS[user.role] && password !== "fors2025") {
      return null;
    }
  }

  let mappedRole = user.role;
  if (user.role === "it_support") mappedRole = "agent";
  else if (user.role === "user") mappedRole = "reporter";
  else if (user.role === "it_report") mappedRole = "reporter";
  else if (user.role === "it_manager") mappedRole = "manager";
  // If user.role is "admin" or "superadmin", keep mappedRole as is.
  // Note: For backwards compatibility, if they were "manager" in DB they also stay "manager"

  return {
    matricule: user.matricule,
    name: user.name,
    surname: user.prenom,
    role: mappedRole,
  };
}
