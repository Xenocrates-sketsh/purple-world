import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { q, qOne, assertExists } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

const FIELDS = ["content", "grammar", "vocabulary", "reading", "writing", "listening"];

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth("teacher");
    assertExists(
      await qOne<Record<string, unknown>>(`SELECT id FROM program_lessons WHERE id = $1`, [params.id]),
      "Lesson"
    );
    const body = await request.json().catch(() => ({}));
    const sets: string[] = [];
    const values: unknown[] = [];
    const push = (col: string, val: unknown) => {
      values.push(val);
      sets.push(`${col} = $${values.length}`);
    };
    if (body.title !== undefined) push("title", String(body.title));
    if (body.position !== undefined) push("position", Number(body.position));
    for (const f of FIELDS) {
      if (body[f] !== undefined) push(f, body[f] === "" ? null : String(body[f]));
    }
    if (sets.length === 0) return NextResponse.json({ ok: true });
    values.push(params.id);
    await q(
      `UPDATE program_lessons SET ${sets.join(", ")} WHERE id = $${values.length}`,
      values
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
      await qOne<Record<string, unknown>>(`SELECT id FROM program_lessons WHERE id = $1`, [params.id]),
      "Lesson"
    );
    await q(`DELETE FROM program_lessons WHERE id = $1`, [params.id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";