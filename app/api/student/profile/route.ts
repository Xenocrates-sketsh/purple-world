import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/portal-auth";
import { q } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    const { student } = await requireStudent();
    const rows = await q<Record<string, unknown>>(
      `SELECT s.*, p.full_name, p.email, p.avatar_url,
         g.name AS group_name, g.color AS group_color
       FROM students s
       JOIN profiles p ON p.id = s.profile_id
       LEFT JOIN groups g ON g.id = s.group_id
       WHERE s.id = $1`,
      [student.id]
    );
    const r = rows[0];
    return NextResponse.json({
      id: student.id,
      profileId: student.profileId,
      fullName: String(r?.full_name ?? ""),
      email: String(r?.email ?? ""),
      avatarUrl: (r?.avatar_url as string) ?? null,
      studentNo: student.studentNo,
      groupId: student.groupId,
      groupName: (r?.group_name as string) ?? null,
      groupColor: (r?.group_color as string) ?? null,
      phone: (r?.phone as string) ?? null,
      parentPhone: (r?.parent_phone as string) ?? null,
      school: (r?.school as string) ?? null,
      stream: (r?.stream as string) ?? null,
      active: Boolean(r?.active),
      registeredAt: String(r?.registered_at ?? ""),
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";