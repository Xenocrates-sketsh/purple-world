import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/portal-auth";
import { q, assertExists } from "@/lib/queries";
import { errorResponse } from "@/lib/http";
import { notify } from "@/lib/notify";

export async function POST(
  request: Request,
  { params }: { params: { exerciseId: string } }
) {
  try {
    const { student } = await requireStudent();

    const [exercise] = await q<Record<string, unknown>>(
      `SELECT e.* FROM exercises e WHERE e.id = $1 AND e.archived = false`,
      [params.exerciseId]
    );
    assertExists(exercise, "Exercise");

    const assigned = await q(
      `SELECT 1 FROM exercise_assignments ea
       WHERE ea.exercise_id = $1 AND (ea.student_id = $2 OR ea.group_id = $3)
       LIMIT 1`,
      [params.exerciseId, student.id, student.groupId]
    );
    const globalFallback = (
      await q(
        `SELECT 1 FROM exercise_assignments ea WHERE ea.exercise_id = $1 LIMIT 1`,
        [params.exerciseId]
      )
    ).length === 0;
    if (assigned.length === 0 && !globalFallback) {
      throw new Error("This exercise is not assigned to you.");
    }

    const existing = await q(
      `SELECT 1 FROM exercise_submissions
       WHERE exercise_id = $1 AND student_id = $2 LIMIT 1`,
      [params.exerciseId, student.id]
    );
    if (existing.length > 0) throw new Error("Already submitted.");

    const body = await request.json().catch(() => ({}));
    const content = String(body.content ?? "").trim();
    const attachmentUrl = String(body.attachmentUrl ?? "").trim();
    if (!content && !attachmentUrl) {
      throw new Error("Provide your answer or an attachment.");
    }

    const isLate =
      exercise.deadline && new Date(String(exercise.deadline)) < new Date();
    const status = isLate ? "late" : "submitted";

    const teacherId = await getTeacherProfileId().catch(() => null);

    const [submission] = await q<Record<string, unknown>>(
      `INSERT INTO exercise_submissions (exercise_id, student_id, content, attachment_url, status)
       VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, ''), $5)
       RETURNING *`,
      [params.exerciseId, student.id, content, attachmentUrl, status]
    );

    if (teacherId) {
      await notify(
        teacherId,
        "new_grade",
        "Exercise submitted",
        `${student.studentNo} submitted "${String(exercise.title)}"`,
        "/teacher/exercises"
      );
    }

    return NextResponse.json(
      {
        id: String(submission?.id),
        status,
        submittedAt: String(submission?.submitted_at ?? new Date().toISOString()),
      },
      { status: 201 }
    );
  } catch (e) {
    return errorResponse(e);
  }
}

async function getTeacherProfileId(): Promise<string> {
  const [row] = await q<Record<string, unknown>>(
    `SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1`,
    []
  );
  if (!row) throw new Error("Teacher not found.");
  return String(row.id);
}

export const dynamic = "force-dynamic";