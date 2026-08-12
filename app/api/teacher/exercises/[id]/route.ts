import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { q, assertExists } from "@/lib/queries";
import { errorResponse } from "@/lib/http";
import { setAssignments } from "../route";

const CATEGORIES = [
  "grammar",
  "vocabulary",
  "reading",
  "writing",
  "listening",
  "bac_preparation",
  "mixed",
];
const DIFFICULTIES = ["easy", "medium", "hard"];

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth("teacher");
    const [exercise] = await q<Record<string, unknown>>(
      `SELECT * FROM exercises WHERE id = $1`,
      [params.id]
    );
    assertExists(exercise, "Exercise");

    const [assignments, submissions] = await Promise.all([
      q<Record<string, unknown>>(
        `SELECT ea.id, ea.group_id, g.name AS group_name, ea.student_id, p.full_name AS student_name
         FROM exercise_assignments ea
         LEFT JOIN groups g ON g.id = ea.group_id
         LEFT JOIN students s ON s.id = ea.student_id
         LEFT JOIN profiles p ON p.id = s.profile_id
         WHERE ea.exercise_id = $1`,
        [params.id]
      ),
      q<Record<string, unknown>>(
        `SELECT sub.*, s.profile_id, p.full_name AS student_name
         FROM exercise_submissions sub
         JOIN students s ON s.id = sub.student_id
         JOIN profiles p ON p.id = s.profile_id
         WHERE sub.exercise_id = $1 ORDER BY sub.submitted_at DESC`,
        [params.id]
      ),
    ]);

    return NextResponse.json({
      id: String(exercise.id),
      title: String(exercise.title),
      description: (exercise.description as string) ?? null,
      instructions: (exercise.instructions as string) ?? null,
      category: String(exercise.category),
      difficulty: String(exercise.difficulty),
      deadline: (exercise.deadline as string) ?? null,
      attachmentUrl: (exercise.attachment_url as string) ?? null,
      archived: Boolean(exercise.archived),
      createdAt: String(exercise.created_at),
      assignments: {
        groupIds: assignments
          .filter((a) => a.group_id)
          .map((a) => String(a.group_id)),
        studentIds: assignments
          .filter((a) => a.student_id)
          .map((a) => String(a.student_id)),
        detail: assignments.map((a) => ({
          kind: a.group_id ? "group" : "student",
          name: String(a.group_name ?? a.student_name ?? ""),
        })),
      },
      submissions: submissions.map((sub) => ({
        id: String(sub.id),
        studentId: String(sub.student_id),
        studentName: String(sub.student_name),
        content: (sub.content as string) ?? "",
        attachmentUrl: (sub.attachment_url as string) ?? null,
        submittedAt: String(sub.submitted_at),
        status: String(sub.status),
        grade: (sub.grade as string) ?? null,
        feedback: (sub.feedback as string) ?? null,
        gradedAt: (sub.graded_at as string) ?? null,
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
      await q<Record<string, unknown>>(`SELECT id FROM exercises WHERE id = $1`, [params.id]),
      "Exercise"
    );
    const body = await request.json().catch(() => ({}));

    await q(
      `UPDATE exercises SET
         title = COALESCE(NULLIF($1,''), title),
         description = COALESCE(NULLIF($2,''), description),
         instructions = COALESCE(NULLIF($3,''), instructions),
         category = COALESCE(NULLIF($4,''), category),
         difficulty = COALESCE(NULLIF($5,''), difficulty),
         deadline = CASE WHEN $6 = '' THEN NULL ELSE COALESCE(NULLIF($6,''), deadline)::timestamptz END,
         attachment_url = COALESCE(NULLIF($7,''), attachment_url),
         archived = COALESCE($8, archived)
       WHERE id = $9`,
      [
        String(body.title ?? ""),
        String(body.description ?? ""),
        String(body.instructions ?? ""),
        CATEGORIES.includes(String(body.category)) ? String(body.category) : "",
        DIFFICULTIES.includes(String(body.difficulty)) ? String(body.difficulty) : "",
        String(body.deadline ?? ""),
        String(body.attachmentUrl ?? ""),
        body.archived === undefined ? null : Boolean(body.archived),
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
      await q<Record<string, unknown>>(`SELECT id FROM exercises WHERE id = $1`, [params.id]),
      "Exercise"
    );
    await q(`DELETE FROM exercises WHERE id = $1`, [params.id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";