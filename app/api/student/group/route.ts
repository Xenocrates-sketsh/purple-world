import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/portal-auth";
import { q } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

type Row = Record<string, unknown>;

export async function GET() {
  try {
    const { student } = await requireStudent();
    if (!student.groupId) {
      return NextResponse.json({ group: null });
    }

    const [group] = await q<Row>(
      `SELECT g.*,
         (SELECT COUNT(*)::int FROM students s WHERE s.group_id = g.id) AS member_count
       FROM groups g WHERE g.id = $1`,
      [student.groupId]
    );

    const [members, lessons, announcements, exercises] = await Promise.all([
      q<Row>(
        `SELECT s.id, s.student_no, p.full_name, p.avatar_url
         FROM students s JOIN profiles p ON p.id = s.profile_id
         WHERE s.group_id = $1 AND s.active = true ORDER BY p.full_name`,
        [student.groupId]
      ),
      q<Row>(
        `SELECT * FROM lessons WHERE group_id = $1 AND starts_at > now() ORDER BY starts_at ASC LIMIT 20`,
        [student.groupId]
      ),
      q<Row>(
        `SELECT * FROM announcements WHERE group_id = $1 ORDER BY created_at DESC LIMIT 10`,
        [student.groupId]
      ),
      q<Row>(
        `SELECT e.id, e.title, e.category, e.deadline FROM exercises e
         WHERE e.archived = false AND EXISTS (
           SELECT 1 FROM exercise_assignments ea WHERE ea.exercise_id = e.id AND ea.group_id = $1
         ) ORDER BY e.created_at DESC LIMIT 20`,
        [student.groupId]
      ),
    ]);

    return NextResponse.json({
      group: group
        ? {
            id: String(group.id),
            name: String(group.name),
            description: (group.description as string) ?? null,
            color: String(group.color),
            memberCount: Number(group.member_count ?? 0),
          }
        : null,
      members: ((members as unknown as Row[]) ?? []).map((m) => ({
        id: String(m.id),
        fullName: String(m.full_name),
        avatarUrl: (m.avatar_url as string) ?? null,
        studentNo: String(m.student_no),
      })),
      lessons: ((lessons as unknown as Row[]) ?? []).map((l) => ({
        id: String(l.id),
        title: String(l.title),
        startsAt: String(l.starts_at),
        durationMin: Number(l.duration_min),
        location: (l.location as string) ?? null,
      })),
      announcements: ((announcements as unknown as Row[]) ?? []).map((a) => ({
        id: String(a.id),
        title: String(a.title),
        content: String(a.content),
        category: String(a.category),
        createdAt: String(a.created_at),
      })),
      exercises: ((exercises as unknown as Row[]) ?? []).map((e) => ({
        id: String(e.id),
        title: String(e.title),
        category: String(e.category),
        deadline: (e.deadline as string) ?? null,
      })),
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";