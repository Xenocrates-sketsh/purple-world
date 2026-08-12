import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { q } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

const TYPES = ["exercise", "test", "homework", "quiz", "exam", "other"];

export async function GET() {
  try {
    await requireAuth("teacher");
    const rows = await q<Record<string, unknown>>(
      `SELECT a.*, g.name AS group_name,
         (SELECT COUNT(*)::int FROM results r WHERE r.assessment_id = a.id) AS result_count
       FROM assessments a
       LEFT JOIN groups g ON g.id = a.group_id
       ORDER BY a.date DESC LIMIT 500`
    );
    return NextResponse.json(
      rows.map((r) => ({
        id: String(r.id),
        title: String(r.title),
        type: String(r.type),
        groupId: r.group_id ? String(r.group_id) : null,
        groupName: (r.group_name as string) ?? null,
        date: String(r.date),
        maxScore: String(r.max_score),
        description: (r.description as string) ?? null,
        resultCount: Number(r.result_count ?? 0),
      }))
    );
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth("teacher");
    const body = await request.json().catch(() => ({}));
    const title = String(body.title ?? "").trim();
    const date = String(body.date ?? "");
    if (!title) throw new Error("Assessment title is required.");
    if (!date) throw new Error("Pick a date.");
    const type = TYPES.includes(String(body.type)) ? String(body.type) : "test";
    const maxScore = body.maxScore === "" || body.maxScore === undefined ? 20 : Number(body.maxScore);

    const [assessment] = await q<Record<string, unknown>>(
      `INSERT INTO assessments (title, type, group_id, date, max_score, description)
       VALUES ($1, $2, NULLIF($3,'')::uuid, $4, $5, NULLIF($6,''))
       RETURNING *`,
      [
        title,
        type,
        String(body.groupId ?? ""),
        date,
        maxScore,
        String(body.description ?? ""),
      ]
    );

    return NextResponse.json(
      {
        id: String(assessment?.id),
        title,
        type,
        groupId: assessment?.group_id ? String(assessment.group_id) : null,
        date,
        maxScore: String(assessment?.max_score),
        description: (assessment?.description as string) ?? null,
        resultCount: 0,
      },
      { status: 201 }
    );
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";