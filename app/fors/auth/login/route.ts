import { NextRequest, NextResponse } from "next/server";
import { createSession, validateCredentials } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { matricule, password } = await req.json();

  if (!matricule || !password) {
    return NextResponse.json({ error: "Matricule and password are required." }, { status: 400 });
  }

  const user = await validateCredentials(matricule, password);

  if (!user) {
    return NextResponse.json({ error: "Invalid matricule or password." }, { status: 401 });
  }

  await createSession(user);

  return NextResponse.json({ ok: true, user });
}
