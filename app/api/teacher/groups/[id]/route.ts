import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { q, assertExists } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

function lessonRow(r: Record<string, unknown>) {
  return {
    id: String(r.id),
    groupId: String(r.group_id),
    title: String(r.title),
    startsAt: String(r.starts_at),
    durationMin: Number(r.duration_min ?? 60),
    location: (r.location as string) ?? null,
    notes: (r.notes as string) ?? null,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth("teacher");
    const [group] = await q<Record<string, unknown>>(
      `SELECT * FROM groups WHERE id = $1`,
      [params.id]
    );
    assertExists(group, "Group");

    const [members, lessons, announcements] = await Promise.all([
      q<Record<string, unknown>>(
        `SELECT s.id, s.student_no, s.active, s.registered_at,
           p.full_name, p.email, p.avatar_url
         FROM students s JOIN profiles p ON p.id = s.profile_id
         WHERE s.group_id = $1 ORDER BY p.full_name`,
        [params.id]
      ),
      q<Record<string, unknown>>(
        `SELECT * FROM lessons WHERE group_id = $1 ORDER BY starts_at ASC`,
        [params.id]
      ),
      q<Record<string, unknown>>(
        `SELECT * FROM announcements WHERE group_id = $1 ORDER BY created_at DESC LIMIT 10`,
        [params.id]
      ),
    ]);

    return NextResponse.json({
      id: String(group.id),
      name: String(group.name),
      description: (group.description as string) ?? null,
      color: String(group.color),
      inviteCode: String(group.invite_code),
      createdAt: String(group.created_at),
      members: members.map((m) => ({
        id: String(m.id),
        profileId: String(m.profile_id),
        fullName: String(m.full_name),
        email: String(m.email),
        avatarUrl: (m.avatar_url as string) ?? null,
        studentNo: String(m.student_no),
        active: Boolean(m.active),
        registeredAt: String(m.registered_at),
      })),
      lessons: lessons.map(lessonRow),
      announcements: announcements.map((a) => ({
        id: String(a.id),
        title: String(a.title),
        content: String(a.content),
        category: String(a.category),
        createdAt: String(a.created_at),
      })),
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth("teacher");
    assertExists(
      await qOneGroup(params.id),
      "Group"
    );
    const body = await request.json().catch(() => ({}));
    await q(
      `UPDATE groups SET
         name = COALESCE(NULLIF($1,''), name),
         description = COALESCE(NULLIF($2,''), description),
         color = COALESCE(NULLIF($3,''), color)
       WHERE id = $4`,
      [
        String(body.name ?? ""),
        String(body.description ?? ""),
        String(body.color ?? ""),
        params.id,
      ]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth("teacher");
    assertExists(await qOneGroup(params.id), "Group");
    await q(
      `UPDATE students SET group_id = NULL WHERE group_id = $1`,
      [params.id]
    );
    await q(`DELETE FROM groups WHERE id = $1`, [params.id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

async function qOneGroup(id: string) {
  const rows = await q<Record<string, unknown>>(
    `SELECT id FROM groups WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export const dynamic = "force-dynamic";