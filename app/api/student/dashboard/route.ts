import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/portal-auth";
import { q } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

type Row = Record<string, unknown>;

export async function GET() {
  try {
    const { student } = await requireStudent();
    const sid = student.id;

    const [profile] = await q<Row>(
      `SELECT s.*, p.full_name, p.email, p.avatar_url,
         g.name AS group_name, g.color AS group_color
       FROM students s
       JOIN profiles p ON p.id = s.profile_id
       LEFT JOIN groups g ON g.id = s.group_id
       WHERE s.id = $1`,
      [sid]
    );

    const groupId = profile?.group_id ? String(profile.group_id) : null;

    const [nextLesson] = await q<Row>(
      `SELECT l.*, g.name AS group_name, g.color AS group_color
       FROM lessons l JOIN groups g ON g.id = l.group_id
       WHERE l.group_id = $1 AND l.starts_at > now()
       ORDER BY l.starts_at ASC LIMIT 1`,
      [groupId ?? ""]
    );

    const announcements = await q<Row>(
      `SELECT * FROM announcements
       WHERE (target = 'all') OR (target = 'group' AND group_id = $1) OR (target = 'student' AND student_id = $2)
       ORDER BY created_at DESC LIMIT 5`,
      [groupId ?? "", sid]
    );

    const latestGrades = await q<Row>(
      `SELECT r.id, a.title, r.score, a.max_score, a.date
       FROM results r JOIN assessments a ON a.id = r.assessment_id
       WHERE r.student_id = $1 ORDER BY a.date DESC LIMIT 4`,
      [sid]
    );

    const [pending] = await q<Row>(
      `SELECT COUNT(*)::int AS n FROM exercises e
       WHERE e.archived = false AND e.deadline > now() AND NOT EXISTS (
         SELECT 1 FROM exercise_submissions sub WHERE sub.exercise_id = e.id AND sub.student_id = $1
       ) AND (
         (SELECT COUNT(*) FROM exercise_assignments ea WHERE ea.exercise_id = e.id) = 0
         OR EXISTS (SELECT 1 FROM exercise_assignments ea
                     WHERE ea.exercise_id = e.id AND (ea.student_id = $1 OR ea.group_id = $2))
       )`,
      [sid, groupId ?? ""]
    );

    const [unread] = await q<Row>(
      `SELECT COUNT(*)::int AS n FROM messages WHERE recipient_id = $1 AND read_at IS NULL`,
      [student.profileId]
    );

    const [payment] = await q<Row>(
      `SELECT * FROM payments WHERE student_id = $1 AND paid_date IS NULL ORDER BY due_date DESC LIMIT 1`,
      [sid]
    );

    const [attendance] = await q<Row>(
      `SELECT COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'present')::int AS present,
         COUNT(*) FILTER (WHERE status = 'absent')::int AS absent,
         COUNT(*) FILTER (WHERE status = 'late')::int AS late,
         COUNT(*) FILTER (WHERE status = 'excused')::int AS excused
       FROM attendance WHERE student_id = $1`,
      [sid]
    );

    return NextResponse.json({
      profile: {
        id: sid,
        profileId: student.profileId,
        fullName: String(profile?.full_name ?? ""),
        email: String(profile?.email ?? ""),
        avatarUrl: (profile?.avatar_url as string) ?? null,
        studentNo: String(profile?.student_no ?? ""),
        groupId,
        groupName: (profile?.group_name as string) ?? null,
        phone: (profile?.phone as string) ?? null,
        school: (profile?.school as string) ?? null,
        stream: (profile?.stream as string) ?? null,
        active: Boolean(profile?.active),
        registeredAt: String(profile?.registered_at ?? ""),
      },
      nextLesson: nextLesson
        ? {
            id: String(nextLesson.id),
            title: String(nextLesson.title),
            startsAt: String(nextLesson.starts_at),
            durationMin: Number(nextLesson.duration_min),
            location: (nextLesson.location as string) ?? null,
            groupName: String(nextLesson.group_name),
            groupColor: String(nextLesson.group_color),
          }
        : null,
      latestAnnouncements: announcements.map((a) => ({
        id: String(a.id),
        title: String(a.title),
        content: String(a.content),
        category: String(a.category),
        createdAt: String(a.created_at),
      })),
      latestGrades: latestGrades.map((g) => ({
        id: String(g.id),
        title: String(g.title),
        score: String(g.score),
        maxScore: String(g.max_score),
        date: String(g.date),
      })),
      pendingExercises: Number(pending?.n ?? 0),
      unreadMessages: Number(unread?.n ?? 0),
      paymentStatus: payment ? String(payment.status) : null,
      attendance:
        Number(attendance?.total) > 0
          ? {
              rate: Math.round((100 * Number(attendance?.present)) / Number(attendance?.total)),
              present: Number(attendance?.present),
              absent: Number(attendance?.absent),
              late: Number(attendance?.late),
              excused: Number(attendance?.excused),
            }
          : null,
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";