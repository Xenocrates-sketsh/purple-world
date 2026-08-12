import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { q } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

type Row = Record<string, unknown>;

export async function GET() {
  try {
    const auth = await requireAuth("teacher");
    const rows = await q<Row>(
      `SELECT s.id AS student_id, p.id AS profile_id, p.full_name, p.avatar_url, s.active,
         (SELECT m.content FROM messages m
            WHERE (m.sender_id = s.profile_id AND m.recipient_id = $1)
               OR (m.sender_id = $1 AND m.recipient_id = s.profile_id)
            ORDER BY m.created_at DESC LIMIT 1) AS last_message,
         (SELECT m.created_at FROM messages m
            WHERE (m.sender_id = s.profile_id AND m.recipient_id = $1)
               OR (m.sender_id = $1 AND m.recipient_id = s.profile_id)
            ORDER BY m.created_at DESC LIMIT 1) AS last_at,
         (SELECT COUNT(*)::int FROM messages m
            WHERE m.sender_id = s.profile_id AND m.recipient_id = $1 AND m.read_at IS NULL) AS unread
       FROM students s
       JOIN profiles p ON p.id = s.profile_id
       WHERE s.active = true
       ORDER BY last_at DESC NULLS LAST, p.full_name ASC`,
      [auth.id]
    );

    return NextResponse.json(
      rows.map((r) => ({
        studentId: String(r.student_id),
        profileId: String(r.profile_id),
        fullName: String(r.full_name),
        avatarUrl: (r.avatar_url as string) ?? null,
        lastMessage: (r.last_message as string) ?? null,
        lastAt: (r.last_at as string) ?? null,
        unread: Number(r.unread ?? 0),
      }))
    );
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";