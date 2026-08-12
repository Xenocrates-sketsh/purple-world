import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { q, assertExists } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; submissionId: string } }
) {
  try {
    await requireAuth("teacher");
    const [submission] = await q<Record<string, unknown>>(
      `SELECT sub.*, s.profile_id FROM exercise_submissions sub
       JOIN students s ON s.id = sub.student_id
       WHERE sub.id = $1`,
      [params.submissionId]
    );
    assertExists(submission, "Submission");
    const body = await request.json().catch(() => ({}));

    const grade = body.grade === "" || body.grade === null || body.grade === undefined
      ? null
      : Number(body.grade);
    if (grade !== null && !Number.isFinite(grade)) throw new Error("Enter a valid grade.");

    await q(
      `UPDATE exercise_submissions SET
         grade = $1, feedback = NULLIF($2,''), status = CASE WHEN $1 IS NULL THEN 'submitted' ELSE 'graded' END,
         graded_at = CASE WHEN $1 IS NULL THEN NULL ELSE now() END
       WHERE id = $3`,
      [grade, String(body.feedback ?? ""), params.submissionId]
    );

    // Notify the student that their work has been graded.
    if (grade !== null) {
      const { notify } = await import("@/lib/notify");
      await notify(
        String(submission.profile_id),
        "new_grade",
        "Exercise graded",
        `Your exercise was graded: ${grade}/20.`,
        "/student/exercises"
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";