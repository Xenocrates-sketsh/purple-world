import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { q, assertExists } from "@/lib/queries";
import { errorResponse } from "@/lib/http";
import { notify } from "@/lib/notify";

function msg(r: Record<string, unknown>) {
  return {
    id: String(r.id),
    senderId: String(r.sender_id),
    recipientId: String(r.recipient_id),
    content: String(r.content),
    readAt: (r.read_at as string) ?? null,
    createdAt: String(r.created_at),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { studentId: string } }
) {
  try {
    const auth = await requireAuth("teacher");
    const [student] = await q<Record<string, unknown>>(
      `SELECT s.*, p.full_name, p.avatar_url FROM students s
       JOIN profiles p ON p.id = s.profile_id WHERE s.id = $1`,
      [params.studentId]
    );
    assertExists(student, "Student");

    const messages = await q<Record<string, unknown>>(
      `SELECT * FROM messages
       WHERE (sender_id = $2 AND recipient_id = $1)
          OR (sender_id = $1 AND recipient_id = $2)
       ORDER BY created_at ASC LIMIT 500`,
      [auth.id, String(student.profile_id)]
    );

    // Mark incoming messages as read.
    await q(
      `UPDATE messages SET read_at = now()
       WHERE sender_id = $1 AND recipient_id = $2 AND read_at IS NULL`,
      [String(student.profile_id), auth.id]
    );

    return NextResponse.json({
      student: {
        id: String(student.id),
        fullName: String(student.full_name),
        avatarUrl: (student.avatar_url as string) ?? null,
        studentNo: String(student.student_no),
      },
      messages: messages.map(msg),
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(
  request: Request,
  { params }: { params: { studentId: string } }
) {
  try {
    const auth = await requireAuth("teacher");
    const [student] = await q<Record<string, unknown>>(
      `SELECT s.*, p.full_name FROM students s
       JOIN profiles p ON p.id = s.profile_id WHERE s.id = $1`,
      [params.studentId]
    );
    assertExists(student, "Student");
    const body = await request.json().catch(() => ({}));
    const content = String(body.content ?? "").trim();
    if (!content) throw new Error("Message cannot be empty.");

    const [message] = await q<Record<string, unknown>>(
      `INSERT INTO messages (sender_id, recipient_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [auth.id, String(student.profile_id), content]
    );

    await notify(
      String(student.profile_id),
      "message",
      `New message from ${auth.fullName}`,
      content.length > 90 ? content.slice(0, 90) + "…" : content,
      "/student/chat"
    );

    return NextResponse.json(msg(message ?? {}), { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";