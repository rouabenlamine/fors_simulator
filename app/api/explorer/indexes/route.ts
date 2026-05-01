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
      `SELECT id, name, isUnique, fields, description
       FROM database_indexes
       WHERE tableId = ?
       ORDER BY name ASC`,
      [tableId],
    );

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("[api/explorer/indexes]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
