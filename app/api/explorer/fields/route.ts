import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tableId = searchParams.get("tableId");

  if (!tableId) {
    return NextResponse.json({ error: "tableId is required" }, { status: 400 });
  }

  try {
    const rows = await query<any>(
      `SELECT id, name, type, length, nullable, description, position
       FROM database_fields
       WHERE tableId = ?
       ORDER BY position ASC`,
      [tableId]
    );
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("[api/explorer/fields]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
