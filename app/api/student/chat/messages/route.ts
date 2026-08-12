import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/portal-auth";
import { q } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

function getTeacherProfileId() {
  return q<Record<string, unknown>>(
    `SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1`,
    []
  );
}

export async function GET() {
  try {
    const { student } = await requireStudent();
    const [teacher] = await getTeacherProfileId();
    if (!teacher) throw new Error("Teacher not found.");

    const messages = await q<Record<string, unknown>>(
      `SELECT * FROM messages
       WHERE (sender_id = $1 AND recipient_id = $2)
          OR (sender_id = $2 AND recipient_id = $1)
       ORDER BY created_at ASC LIMIT 500`,
      [student.profileId, String(teacher.id)]
    );

    await q(
      `UPDATE messages SET read_at = now()
       WHERE sender_id = $1 AND recipient_id = $2 AND read_at IS NULL`,
      [String(teacher.id), student.profileId]
    );

    return NextResponse.json(
      messages.map((m) => ({
        id: String(m.id),
        senderId: String(m.sender_id),
        recipientId: String(m.recipient_id),
        content: String(m.content),
        readAt: (m.read_at as string) ?? null,
        createdAt: String(m.created_at),
      }))
    );
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    const { student } = await requireStudent();
    const [teacher] = await getTeacherProfileId();
    if (!teacher) throw new Error("Teacher not found.");

    const body = await request.json().catch(() => ({}));
    const content = String(body.content ?? "").trim();
    if (!content) throw new Error("Message cannot be empty.");

    const [message] = await q<Record<string, unknown>>(
      `INSERT INTO messages (sender_id, recipient_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [student.profileId, String(teacher.id), content]
    );

    return NextResponse.json(
      {
        id: String(message?.id),
        senderId: String(message?.sender_id),
        recipientId: String(message?.recipient_id),
        content: content,
        readAt: null,
        createdAt: String(message?.created_at ?? new Date().toISOString()),
      },
      { status: 201 }
    );
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";