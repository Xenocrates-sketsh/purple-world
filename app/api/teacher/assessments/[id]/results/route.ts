import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { q, assertExists } from "@/lib/queries";
import { errorResponse } from "@/lib/http";
import { notify } from "@/lib/notify";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth("teacher");
    const [assessment] = await q<Record<string, unknown>>(
      `SELECT * FROM assessments WHERE id = $1`,
      [params.id]
    );
    assertExists(assessment, "Assessment");
    const maxScore = parseFloat(String(assessment.max_score)) || 20;

    const body = await request.json().catch(() => ({}));
    const results = Array.isArray(body.results) ? body.results : [];

    // Delete existing results, then write the new set (save semantics).
    await q(`DELETE FROM results WHERE assessment_id = $1`, [params.id]);

    const profileIds: { studentId: string; profileId: string }[] = [];
    for (const rec of results) {
      const studentId = String(rec.studentId ?? "");
      const score = String(rec.score ?? "");
      if (!studentId || score === "") continue;
      const parsed = Number(score);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > maxScore) {
        throw new Error(`Score must be between 0 and ${maxScore}.`);
      }
      const [student] = await q<Record<string, unknown>>(
        `SELECT profile_id FROM students WHERE id = $1`,
        [studentId]
      );
      if (!student) throw new Error("Unknown student.");
      profileIds.push({ studentId, profileId: String(student.profile_id) });
      await q(
        `INSERT INTO results (assessment_id, student_id, score, feedback)
         VALUES ($1, $2, $3, NULLIF($4,''))`,
        [
          params.id,
          studentId,
          parsed,
          String(rec.feedback ?? ""),
        ]
      );
    }

    // Notify students whose grades were posted.
    const title = String(assessment.title);
    for (const p of profileIds) {
      await notify(
        p.profileId,
        "new_grade",
        `New grade: ${title}`,
        `A result for “${title}” is now available.`,
        "/student/grades"
      );
    }

    return NextResponse.json({ ok: true, graded: profileIds.length });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";