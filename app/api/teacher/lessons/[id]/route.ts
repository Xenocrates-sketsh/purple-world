import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { q, assertExists } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth("teacher");
    assertExists(await lessonExists(params.id), "Lesson");
    const body = await request.json().catch(() => ({}));
    await q(
      `UPDATE lessons SET
         title = COALESCE(NULLIF($1,''), title),
         starts_at = COALESCE(NULLIF($2,'')::timestamptz, starts_at),
         duration_min = COALESCE($3, duration_min),
         location = COALESCE(NULLIF($4,''), location),
         notes = COALESCE(NULLIF($5,''), notes)
       WHERE id = $6`,
      [
        String(body.title ?? ""),
        String(body.startsAt ?? ""),
        body.durationMin === undefined ? null : Number(body.durationMin),
        String(body.location ?? ""),
        String(body.notes ?? ""),
        params.id,
      ]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth("teacher");
    assertExists(await lessonExists(params.id), "Lesson");
    await q(`DELETE FROM lessons WHERE id = $1`, [params.id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

async function lessonExists(id: string) {
  const rows = await q<Record<string, unknown>>(
    `SELECT id FROM lessons WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export const dynamic = "force-dynamic";