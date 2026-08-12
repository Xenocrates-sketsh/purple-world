import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { q } from "@/lib/queries";
import { errorResponse } from "@/lib/http";
import { notify } from "@/lib/notify";
import { sql } from "drizzle-orm";
import { db } from "@/db";

const CATEGORIES = [
  "new_lesson",
  "schedule_change",
  "new_exercise",
  "exam_reminder",
  "payment_reminder",
  "general",
  "bac_info",
];
const TARGETS = ["all", "group", "student"];

export async function GET() {
  try {
    await requireAuth("teacher");
    const rows = await q<Record<string, unknown>>(
      `SELECT a.*, g.name AS group_name,
         p.full_name AS student_name
       FROM announcements a
       LEFT JOIN groups g ON g.id = a.group_id
       LEFT JOIN students s ON s.id = a.student_id
       LEFT JOIN profiles p ON p.id = s.profile_id
       ORDER BY a.created_at DESC LIMIT 300`
    );
    return NextResponse.json(
      rows.map((r) => ({
        id: String(r.id),
        title: String(r.title),
        content: String(r.content),
        category: String(r.category),
        target: String(r.target),
        groupId: r.group_id ? String(r.group_id) : null,
        groupName: (r.group_name as string) ?? null,
        studentId: r.student_id ? String(r.student_id) : null,
        studentName: (r.student_name as string) ?? null,
        createdAt: String(r.created_at),
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
    const content = String(body.content ?? "").trim();
    if (!title || !content) throw new Error("Title and message are required.");

    const category = CATEGORIES.includes(String(body.category)) ? String(body.category) : "general";
    const target = TARGETS.includes(String(body.target)) ? String(body.target) : "all";
    const groupId = body.groupId ? String(body.groupId) : null;
    const studentId = body.studentId ? String(body.studentId) : null;

    const [announcement] = await q<Record<string, unknown>>(
      `INSERT INTO announcements (title, content, category, target, group_id, student_id)
       VALUES ($1, $2, $3, $4, $5::uuid, $6::uuid) RETURNING *`,
      [title, content, category, target, groupId, studentId]
    );

    await notifyTargets(title, content, target, groupId, studentId);

    return NextResponse.json(
      {
        id: String(announcement?.id),
        title,
        content,
        category,
        target,
        groupId,
        groupName: null,
        studentId,
        studentName: null,
        createdAt: String(announcement?.created_at),
      },
      { status: 201 }
    );
  } catch (e) {
    return errorResponse(e);
  }
}

export async function notifyTargets(
  title: string,
  content: string,
  target: string,
  groupId: string | null,
  studentId: string | null
) {
  const type = "new_announcement" as const;
  if (target === "all") {
    const profiles = (await db.execute(
      sql.raw(
        `SELECT s.profile_id FROM students s JOIN profiles p ON p.id = s.profile_id WHERE s.active = true`
      )
    )) as unknown as { profile_id: string }[];
    for (const p of profiles)
      await notify(p.profile_id, type, `New announcement: ${title}`, content, "/student/announcements");
  } else if (target === "group" && groupId) {
    const members = await q<{ profile_id: string }>(
      `SELECT profile_id FROM students WHERE group_id = $1 AND active = true`,
      [groupId]
    );
    for (const m of members)
      await notify(m.profile_id, type, `New announcement: ${title}`, content, "/student/announcements");
  } else if (target === "student" && studentId) {
    const [st] = await q<Record<string, unknown>>(
      `SELECT profile_id FROM students WHERE id = $1`,
      [studentId]
    );
    if (st)
      await notify(
        String(st.profile_id),
        type,
        `New announcement: ${title}`,
        content,
        "/student/announcements"
      );
  }
}

export const dynamic = "force-dynamic";