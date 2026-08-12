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
    assertExists(
      await q<Record<string, unknown>>(`SELECT id FROM program_units WHERE id = $1`, [params.id]),
      "Unit"
    );
    const body = await request.json().catch(() => ({}));
    await q(
      `UPDATE program_units SET
         title = COALESCE(NULLIF($1,''), title),
         description = COALESCE(NULLIF($2,''), description),
         position = COALESCE($3, position)
       WHERE id = $4`,
      [
        String(body.title ?? ""),
        String(body.description ?? ""),
        body.position === undefined ? null : Number(body.position),
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
      await q<Record<string, unknown>>(`SELECT id FROM program_units WHERE id = $1`, [params.id]),
      "Unit"
    );
    await q(`DELETE FROM program_units WHERE id = $1`, [params.id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";