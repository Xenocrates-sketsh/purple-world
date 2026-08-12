import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/portal-auth";
import { q } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

type Row = Record<string, unknown>;
type ExerciseRow = {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  category: string;
  difficulty: string;
  deadline: string | null;
  attachmentUrl: string | null;
  createdAt: string;
  assigned: boolean;
  submitted: boolean;
  status: string | null;
  grade: string | null;
  feedback: string | null;
  submittedAt: string | null;
};

export async function GET() {
  try {
    const { student } = await requireStudent();

    const rows = await q<Row>(
      `SELECT e.id, e.title, e.description, e.instructions, e.category, e.difficulty,
         e.deadline, e.attachment_url, e.created_at,
         sub.id AS submission_id, sub.status AS submission_status,
         sub.grade, sub.feedback, sub.submitted_at
       FROM exercises e
       LEFT JOIN exercise_submissions sub ON sub.exercise_id = e.id AND sub.student_id = $1
       WHERE e.archived = false AND (
         (SELECT COUNT(*) FROM exercise_assignments ea WHERE ea.exercise_id = e.id) = 0
         OR EXISTS (SELECT 1 FROM exercise_assignments ea
                     WHERE ea.exercise_id = e.id AND (ea.student_id = $1 OR ea.group_id = $2))
       )
       ORDER BY e.created_at DESC LIMIT 200`,
      [student.id, student.groupId ?? ""]
    );

    const mapped: ExerciseRow[] = rows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      description: (r.description as string) ?? null,
      instructions: (r.instructions as string) ?? null,
      category: String(r.category),
      difficulty: String(r.difficulty),
      deadline: (r.deadline as string) ?? null,
      attachmentUrl: (r.attachment_url as string) ?? null,
      createdAt: String(r.created_at),
      assigned: true,
      submitted: Boolean(r.submission_id),
      status: (r.submission_status as string) ?? null,
      grade: (r.grade as string) ?? null,
      feedback: (r.feedback as string) ?? null,
      submittedAt: (r.submitted_at as string) ?? null,
    }));

    return NextResponse.json(mapped);
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";