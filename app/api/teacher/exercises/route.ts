import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { q, setAssignments } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

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

async function loadExercises(includeArchived = false) {
  const archivedWhere = includeArchived ? "" : "WHERE e.archived = false";
  const rows = await q<Record<string, unknown>>(
    `SELECT e.*,
       (SELECT COUNT(DISTINCT s.id)::int FROM students s
          WHERE s.active = true AND (
            (SELECT COUNT(*) FROM exercise_assignments ea WHERE ea.exercise_id = e.id) = 0
            OR EXISTS (SELECT 1 FROM exercise_assignments ea
                        WHERE ea.exercise_id = e.id
                          AND (ea.student_id = s.id OR ea.group_id = s.group_id)))) AS assigned_count,
       (SELECT COUNT(*)::int FROM exercise_submissions sub WHERE sub.exercise_id = e.id) AS submission_count,
       (SELECT COUNT(*)::int FROM exercise_submissions sub
          WHERE sub.exercise_id = e.id AND sub.status <> 'graded') AS pending_count
     FROM exercises e
     ${archivedWhere}
     ORDER BY e.created_at DESC LIMIT 300`
  );
  return rows.map((r) => ({
    id: String(r.id),
    title: String(r.title),
    description: (r.description as string) ?? null,
    instructions: (r.instructions as string) ?? null,
    category: String(r.category),
    difficulty: String(r.difficulty),
    deadline: (r.deadline as string) ?? null,
    attachmentUrl: (r.attachment_url as string) ?? null,
    archived: Boolean(r.archived),
    createdAt: String(r.created_at),
    assignedCount: Number(r.assigned_count ?? 0),
    submissionCount: Number(r.submission_count ?? 0),
    pendingCount: Number(r.pending_count ?? 0),
  }));
}

export async function GET(request: Request) {
  try {
    await requireAuth("teacher");
    const includeArchived =
      new URL(request.url).searchParams.get("archived") === "1";
    return NextResponse.json(await loadExercises(includeArchived));
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth("teacher");
    const body = await request.json().catch(() => ({}));
    const title = String(body.title ?? "").trim();
    if (!title) throw new Error("Exercise title is required.");

    const category = CATEGORIES.includes(String(body.category)) ? String(body.category) : "mixed";
    const difficulty = DIFFICULTIES.includes(String(body.difficulty)) ? String(body.difficulty) : "medium";

    const [exercise] = await q<Record<string, unknown>>(
      `INSERT INTO exercises (title, description, instructions, category, difficulty, deadline, attachment_url)
       VALUES ($1, NULLIF($2,''), NULLIF($3,''), $4, $5,
               NULLIF($6,'')::timestamptz, NULLIF($7,''))
       RETURNING *`,
      [
        title,
        String(body.description ?? ""),
        String(body.instructions ?? ""),
        category,
        difficulty,
        String(body.deadline ?? ""),
        String(body.attachmentUrl ?? ""),
      ]
    );

    await setAssignments(String(exercise?.id), body);

    return NextResponse.json(
      {
        id: String(exercise?.id),
        title,
        description: (exercise?.description as string) ?? null,
        instructions: (exercise?.instructions as string) ?? null,
        category,
        difficulty,
        deadline: (exercise?.deadline as string) ?? null,
        attachmentUrl: (exercise?.attachment_url as string) ?? null,
        archived: false,
        createdAt: String(exercise?.created_at),
        assignedCount: 0,
        submissionCount: 0,
        pendingCount: 0,
      },
      { status: 201 }
    );
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";