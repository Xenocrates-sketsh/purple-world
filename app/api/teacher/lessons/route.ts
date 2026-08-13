import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { q } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

function lessonRow(r: Record<string, unknown>) {
  return {
    id: String(r.id),
    groupId: String(r.group_id),
    groupName: String(r.group_name ?? ""),
    groupColor: String(r.group_color ?? "#7c3aed"),
    title: String(r.title),
    startsAt: String(r.starts_at),
    durationMin: Number(r.duration_min ?? 60),
    location: (r.location as string) ?? null,
    notes: (r.notes as string) ?? null,
  };
}

export async function GET(request: Request) {
  try {
    await requireAuth("teacher");
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let where = "";
    const params: unknown[] = [];
    if (from) {
      if (Number.isNaN(Date.parse(from))) throw new Error("Invalid from date.");
      params.push(from);
      where += `${where ? " AND " : "WHERE "}l.starts_at >= $${params.length}::date`;
    }
    if (to) {
      if (Number.isNaN(Date.parse(to))) throw new Error("Invalid to date.");
      params.push(to);
      where += `${where ? " AND " : "WHERE "}l.starts_at < ($${params.length}::date + interval '1 day')`;
    }

    const rows = await q<Record<string, unknown>>(
      `SELECT l.*, g.name AS group_name, g.color AS group_color,
         EXISTS (SELECT 1 FROM attendance a WHERE a.lesson_id = l.id) AS attendance_marked
       FROM lessons l JOIN groups g ON g.id = l.group_id
       ${where}
       ORDER BY l.starts_at ASC LIMIT 400`,
      params
    );

    return NextResponse.json(
      rows.map((r) => ({ ...lessonRow(r), attendanceMarked: Boolean(r.attendance_marked) }))
    );
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth("teacher");
    const body = await request.json().catch(() => ({}));
    const groupId = String(body.groupId ?? "");
    const title = String(body.title ?? "").trim() || "English lesson";
    const startsAt = String(body.startsAt ?? "");
    const durationMin = Number.isFinite(Number(body.durationMin))
      ? Number(body.durationMin)
      : 60;
    if (!groupId) throw new Error("Select a group.");
    if (!startsAt) throw new Error("Pick a date and time.");
    if (Number.isNaN(Date.parse(startsAt))) throw new Error("Invalid date and time.");

    const [lesson] = await q<Record<string, unknown>>(
      `INSERT INTO lessons (group_id, title, starts_at, duration_min, location, notes)
       VALUES ($1, $2, $3, $4, NULLIF($5,''), NULLIF($6,''))
       RETURNING *`,
      [
        groupId,
        title,
        startsAt,
        durationMin,
        String(body.location ?? ""),
        String(body.notes ?? ""),
      ]
    );

    return NextResponse.json(lessonRow({ ...lesson, group_name: "", group_color: "#7c3aed" }), {
      status: 201,
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";