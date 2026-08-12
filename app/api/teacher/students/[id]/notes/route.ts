import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { getStudentById, assertExists, q } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth("teacher");
    assertExists(await getStudentById(params.id), "Student");
    const rows = await q<{ content: string }>(
      `SELECT content FROM teacher_notes WHERE student_id = $1`,
      [params.id]
    );
    return NextResponse.json({ content: rows[0]?.content ?? "" });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth("teacher");
    assertExists(await getStudentById(params.id), "Student");
    const body = await request.json().catch(() => ({}));
    const content = String(body.content ?? "");
    await q(
      `INSERT INTO teacher_notes (student_id, content, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (student_id)
       DO UPDATE SET content = $2, updated_at = now()`,
      [params.id, content]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";