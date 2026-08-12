import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/portal-auth";
import { q } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    const { student } = await requireStudent();

    const [teacher] = await q<Record<string, unknown>>(
      `SELECT p.id, p.full_name, p.avatar_url,
         (SELECT COUNT(*)::int FROM messages m
            WHERE m.sender_id = p.id AND m.recipient_id = $1 AND m.read_at IS NULL) AS unread
       FROM profiles p
       WHERE p.role = 'teacher' LIMIT 1`,
      [student.profileId]
    );

    if (!teacher) {
      return NextResponse.json({ teacher: null, messages: [] });
    }

    const [last] = await q<Record<string, unknown>>(
      `SELECT content, created_at FROM messages
       WHERE (sender_id = $1 AND recipient_id = $2)
          OR (sender_id = $2 AND recipient_id = $1)
       ORDER BY created_at DESC LIMIT 1`,
      [student.profileId, String(teacher.id)]
    );

    return NextResponse.json({
      teacher: {
        profileId: String(teacher.id),
        fullName: String(teacher.full_name),
        avatarUrl: (teacher.avatar_url as string) ?? null,
        lastMessage: (last?.content as string) ?? null,
        lastAt: (last?.created_at as string) ?? null,
        unread: Number(teacher.unread ?? 0),
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";