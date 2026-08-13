import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { q, qOne, assertExists } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth("teacher");
    assertExists(
      await qOne<Record<string, unknown>>(`SELECT id FROM announcements WHERE id = $1`, [params.id]),
      "Announcement"
    );
    const body = await request.json().catch(() => ({}));
    await q(
      `UPDATE announcements SET
         title = COALESCE(NULLIF($1,''), title),
         content = COALESCE(NULLIF($2,''), content),
         category = COALESCE(NULLIF($3,''), category)
       WHERE id = $4`,
      [
        String(body.title ?? ""),
        String(body.content ?? ""),
        String(body.category ?? ""),
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
    assertExists(
      await qOne<Record<string, unknown>>(`SELECT id FROM announcements WHERE id = $1`, [params.id]),
      "Announcement"
    );
    await q(`DELETE FROM announcements WHERE id = $1`, [params.id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";