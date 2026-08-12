import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { q, assertExists } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth("teacher");
    const [assessment] = await q<Record<string, unknown>>(
      `SELECT a.*, g.name AS group_name FROM assessments a
       LEFT JOIN groups g ON g.id = a.group_id WHERE a.id = $1`,
      [params.id]
    );
    assertExists(assessment, "Assessment");

    const [results] = await Promise.all([
      q<Record<string, unknown>>(
        `SELECT r.*, s.profile_id, p.full_name, s.student_no FROM results r
         JOIN students s ON s.id = r.student_id
         JOIN profiles p ON p.id = s.profile_id
         WHERE r.assessment_id = $1 ORDER BY p.full_name`,
        [params.id]
      ),
    ]);

    return NextResponse.json({
      id: String(assessment.id),
      title: String(assessment.title),
      type: String(assessment.type),
      groupId: assessment.group_id ? String(assessment.group_id) : null,
      groupName: (assessment.group_name as string) ?? null,
      date: String(assessment.date),
      maxScore: String(assessment.max_score),
      description: (assessment.description as string) ?? null,
      results: results.map((r) => ({
        id: String(r.id),
        studentId: String(r.student_id),
        studentName: String(r.full_name),
        studentNo: String(r.student_no),
        score: String(r.score),
        feedback: (r.feedback as string) ?? null,
      })),
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth("teacher");
    assertExists(
      await q<Record<string, unknown>>(`SELECT id FROM assessments WHERE id = $1`, [params.id]),
      "Assessment"
    );
    const body = await request.json().catch(() => ({}));
    await q(
      `UPDATE assessments SET
         title = COALESCE(NULLIF($1,''), title),
         type = COALESCE(NULLIF($2,''), type),
         group_id = CASE WHEN $3 = '' THEN NULL ELSE $3::uuid END,
         date = COALESCE(NULLIF($4,''), date),
         max_score = COALESCE($5, max_score),
         description = COALESCE(NULLIF($6,''), description)
       WHERE id = $7`,
      [
        String(body.title ?? ""),
        String(body.type ?? ""),
        String(body.groupId ?? ""),
        String(body.date ?? ""),
        body.maxScore === undefined ? null : Number(body.maxScore),
        String(body.description ?? ""),
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
      await q<Record<string, unknown>>(`SELECT id FROM assessments WHERE id = $1`, [params.id]),
      "Assessment"
    );
    await q(`DELETE FROM assessments WHERE id = $1`, [params.id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";