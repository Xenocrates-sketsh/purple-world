import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/portal-auth";
import { q } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    const { student } = await requireStudent();
    const rows = await q<Record<string, unknown>>(
      `SELECT a.*, g.name AS group_name
       FROM announcements a
       LEFT JOIN groups g ON g.id = a.group_id
       WHERE (a.target = 'all')
          OR (a.target = 'group' AND a.group_id = $1)
          OR (a.target = 'student' AND a.student_id = $2)
       ORDER BY a.created_at DESC LIMIT 100`,
      [student.groupId, student.id]
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
        createdAt: String(r.created_at),
      }))
    );
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";