import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { q } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

export async function POST(request: Request) {
  try {
    await requireAuth("teacher");
    const body = await request.json().catch(() => ({}));
    const title = String(body.title ?? "").trim();
    if (!title) throw new Error("Unit title is required.");
    const [unit] = await q<Record<string, unknown>>(
      `INSERT INTO program_units (title, description, position)
       VALUES ($1, NULLIF($2,''), COALESCE($3, (SELECT COALESCE(MAX(position),0)+1 FROM program_units)))
       RETURNING *`,
      [title, String(body.description ?? ""), body.position === undefined ? null : Number(body.position)]
    );
    return NextResponse.json(
      {
        id: String(unit?.id),
        title,
        description: (unit?.description as string) ?? null,
        position: Number(unit?.position),
        lessons: [],
      },
      { status: 201 }
    );
  } catch (e) {
    return errorResponse(e);
  }
}

export async function GET() {
  try {
    await requireAuth("teacher");
    const rows = await q<Record<string, unknown>>(
      `SELECT * FROM program_units ORDER BY position ASC`
    );
    return NextResponse.json(rows);
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";