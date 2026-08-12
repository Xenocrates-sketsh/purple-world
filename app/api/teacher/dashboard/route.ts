import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { q } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

function lessonRow(r: Record<string, unknown>) {
  return {
    id: String(r.id),
    groupId: String(r.group_id),
    groupName: String(r.group_name ?? ""),
    groupColor: String(r.group_color ?? "#7c3aed"),
    title: String(r.title),
    startsAt: String(r.starts_at),
    durationMin: Number(r.duration_min ?? 60),
    location: (r.location as string) ?? null,
    notes: (r.notes as string) ?? null,
  };
}

export async function GET() {
  try {
    const auth = await requireAuth("teacher");

    const [[totals], todayLessons, upcomingLessons, announcements, [pending], [unread], [avg]] =
      await Promise.all([
        q<Record<string, unknown>>(
          `SELECT
             (SELECT COUNT(*)::int FROM students) AS students,
             (SELECT COUNT(*)::int FROM students WHERE active = true) AS active,
             (SELECT COUNT(DISTINCT s.id)::int FROM students s
                WHERE s.active = true AND EXISTS (
                  SELECT 1 FROM payments pay
                  WHERE pay.student_id = s.id AND pay.paid_date IS NULL AND pay.status IN ('due','overdue'))) AS unpaid,
             (SELECT COUNT(DISTINCT s.id)::int FROM students s
                WHERE s.active = true AND EXISTS (
                  SELECT 1 FROM payments pay
                  WHERE pay.student_id = s.id AND pay.paid_date IS NULL AND pay.status = 'overdue')) AS overdue`
        ),
        q<Record<string, unknown>>(
          `SELECT l.*, g.name AS group_name, g.color AS group_color
           FROM lessons l JOIN groups g ON g.id = l.group_id
           WHERE l.starts_at::date = CURRENT_DATE ORDER BY l.starts_at ASC`
        ),
        q<Record<string, unknown>>(
          `SELECT l.*, g.name AS group_name, g.color AS group_color
           FROM lessons l JOIN groups g ON g.id = l.group_id
           WHERE l.starts_at > now() ORDER BY l.starts_at ASC LIMIT 6`
        ),
        q<Record<string, unknown>>(
          `SELECT * FROM announcements ORDER BY created_at DESC LIMIT 4`
        ),
        q<Record<string, unknown>>(
          `SELECT COUNT(*)::int AS n FROM exercise_submissions sub
           WHERE sub.status <> 'graded'`
        ),
        q<Record<string, unknown>>(
          `SELECT COUNT(*)::int AS n FROM messages m
           JOIN profiles p ON p.id = m.sender_id
           JOIN students s ON s.profile_id = m.sender_id
           WHERE m.recipient_id = $1 AND m.read_at IS NULL`,
          [auth.id]
        ),
        q<Record<string, unknown>>(
          `SELECT ROUND(AVG(r.score::numeric / NULLIF(a.max_score,0) * 100),1) AS v
           FROM results r JOIN assessments a ON a.id = r.assessment_id`
        ),
      ]);

    const paidCount = Number(totals.active) - Number(totals.unpaid);

    return NextResponse.json({
      totals: {
        students: Number(totals.students),
        active: Number(totals.active),
        unpaid: Number(totals.unpaid),
        overdue: Number(totals.overdue),
        paid: Math.max(paidCount, 0),
      },
      todayLessons: todayLessons.map(lessonRow),
      upcomingLessons: upcomingLessons.map(lessonRow),
      recentAnnouncements: announcements.map((r) => ({
        id: String(r.id),
        title: String(r.title),
        content: String(r.content),
        category: String(r.category),
        target: String(r.target),
        createdAt: String(r.created_at),
      })),
      pendingSubmissions: Number(pending.n),
      unreadMessages: Number(unread.n),
      gradeAverage:
        avg.v === null || avg.v === undefined ? null : Number(avg.v),
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";