import { db } from "@/db";
import { sql, type SQL, type SQLChunk } from "drizzle-orm";
import { HttpError } from "@/lib/server-auth";

type Row = Record<string, unknown>;

function bindParams(query: string, params: unknown[] = []): SQL {
  if (params.length === 0) return sql.raw(query);
  const chunks: SQLChunk[] = [];
  const re = /\$(\d+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(query))) {
    if (m.index > last) chunks.push(sql.raw(query.slice(last, m.index)));
    const idx = Number(m[1]) - 1;
    chunks.push(sql.param(idx >= 0 && idx < params.length ? params[idx] : null));
    last = m.index + m[0].length;
  }
  if (last < query.length) chunks.push(sql.raw(query.slice(last)));
  return sql.join(chunks);
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

function toStudentSummary(r: Row) {
  return {
    id: String(r.id),
    profileId: String(r.profile_id),
    fullName: String(r.full_name ?? ""),
    email: String(r.email ?? ""),
    avatarUrl: (r.avatar_url as string) ?? null,
    studentNo: String(r.student_no),
    groupId: r.group_id ? String(r.group_id) : null,
    groupName: (r.group_name as string) ?? null,
    groupColor: (r.group_color as string) ?? null,
    phone: (r.phone as string) ?? null,
    parentPhone: (r.parent_phone as string) ?? null,
    school: (r.school as string) ?? null,
    stream: (r.stream as string) ?? null,
    active: Boolean(r.active),
    registeredAt: String(r.registered_at),
    paymentStatus: (r.payment_status as string) ?? null,
    attendanceRate: r.attendance_rate === null || r.attendance_rate === undefined ? null : num(r.attendance_rate),
    unreadMessages: num(r.unread_messages),
  };
}

export async function listStudents(opts: {
  search?: string;
  filter?: string;
  groupId?: string;
  limit?: number;
}) {
  const { search, filter, groupId } = opts;
  const where: string[] = [];
  const params: unknown[] = [];

  if (groupId) {
    params.push(groupId);
    where.push(`s.group_id = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    const p = params.length;
    where.push(
      `(p.full_name ILIKE $${p} OR p.email ILIKE $${p} OR s.student_no ILIKE $${p} OR s.phone ILIKE $${p})`
    );
  }
  if (filter === "inactive") {
    where.push("s.active = false");
  } else if (filter === "active") {
    where.push("s.active = true");
  } else if (filter === "unpaid") {
    where.push(`s.active = true AND (
      SELECT COALESCE(array_agg(pay.status ORDER BY pay.due_date DESC), '{}')::text[]
      FROM payments pay WHERE pay.student_id = s.id
    )::text[] && ARRAY['due','overdue']`);
  } else if (filter === "overdue") {
    where.push(`s.active = true AND (
      SELECT COUNT(*) FROM payments pay
      WHERE pay.student_id = s.id AND pay.status = 'overdue' AND pay.paid_date IS NULL
    ) > 0`);
  } else if (filter === "no_group") {
    where.push("s.group_id IS NULL");
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const rows = await db.execute(
    bindParams(
      `SELECT s.*, p.full_name, p.email, p.avatar_url,
         g.name AS group_name, g.color AS group_color,
         (SELECT pay.status FROM payments pay
            WHERE pay.student_id = s.id AND pay.paid_date IS NULL
            ORDER BY pay.due_date DESC LIMIT 1) AS payment_status,
         CASE WHEN COUNT(att.id) = 0 THEN NULL
              ELSE ROUND(100.0 * COUNT(att.id) FILTER (WHERE att.status = 'present') / COUNT(att.id))
         END AS attendance_rate,
         (SELECT COUNT(*)::int FROM messages m
            WHERE m.recipient_id = s.profile_id AND m.read_at IS NULL) AS unread_messages
       FROM students s
       JOIN profiles p ON p.id = s.profile_id
       LEFT JOIN groups g ON g.id = s.group_id
       LEFT JOIN attendance att ON att.student_id = s.id
       ${whereSql}
       GROUP BY s.id, p.full_name, p.email, p.avatar_url, g.name, g.color
       ORDER BY p.full_name ASC
       LIMIT 500`,
      params
    )
  );

  return (rows as unknown as Row[]).map(toStudentSummary);
}

export async function getGroupList() {
  const rows = await db.execute(
    sql.raw(
      `SELECT g.*,
         (SELECT COUNT(*)::int FROM students s WHERE s.group_id = g.id) AS member_count
       FROM groups g
       ORDER BY g.name ASC`
    )
  );
  return (rows as unknown as Row[]).map((r) => ({
    id: String(r.id),
    name: String(r.name),
    description: (r.description as string) ?? null,
    color: String(r.color),
    inviteCode: String(r.invite_code),
    memberCount: num(r.member_count),
  }));
}

export async function getStudentById(id: string): Promise<Row | null> {
  const [row] = (await db.execute(
    bindParams(
      `SELECT s.*, p.full_name, p.email, p.avatar_url,
         g.name AS group_name, g.color AS group_color, g.invite_code AS group_invite,
         (SELECT pay.status FROM payments pay
            WHERE pay.student_id = s.id AND pay.paid_date IS NULL
            ORDER BY pay.due_date DESC LIMIT 1) AS payment_status
       FROM students s
       JOIN profiles p ON p.id = s.profile_id
       LEFT JOIN groups g ON g.id = s.group_id
       WHERE s.id = $1`,
      [id]
    )
  )) as unknown as Row[];
  return row ?? null;
}

export async function getStudentStats(id: string) {
  const [attendanceRows] = (await db.execute(
    bindParams(
      `SELECT COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE status = 'present')::int AS present,
         COUNT(*) FILTER (WHERE status = 'absent')::int AS absent,
         COUNT(*) FILTER (WHERE status = 'late')::int AS late,
         COUNT(*) FILTER (WHERE status = 'excused')::int AS excused
       FROM attendance WHERE student_id = $1`,
      [id]
    )
  )) as unknown as Row[];

  const attendanceRecent = (await db.execute(
    bindParams(
      `SELECT att.status, att.marked_at, l.title AS lesson, l.starts_at
       FROM attendance att
       JOIN lessons l ON l.id = att.lesson_id
       WHERE att.student_id = $1
       ORDER BY l.starts_at DESC LIMIT 10`,
      [id]
    )
  )) as unknown as Row[];

  const payments = (await db.execute(
    bindParams(
      `SELECT * FROM payments WHERE student_id = $1 ORDER BY due_date DESC`,
      [id]
    )
  )) as unknown as Row[];

  const grades = (await db.execute(
    bindParams(
      `SELECT r.*, a.title, a.type, a.date, a.max_score
       FROM results r
       JOIN assessments a ON a.id = r.assessment_id
       WHERE r.student_id = $1
       ORDER BY a.date DESC`,
      [id]
    )
  )) as unknown as Row[];

  const exerciseRows = (await db.execute(
    bindParams(
      `SELECT e.id, e.title, e.category, e.difficulty, e.deadline, e.archived,
         sub.id AS submission_id, sub.status AS submission_status, sub.grade, sub.submitted_at
       FROM exercises e
       LEFT JOIN exercise_submissions sub ON sub.exercise_id = e.id AND sub.student_id = $1
       WHERE e.archived = false AND (
         (SELECT COUNT(*) FROM exercise_assignments ea WHERE ea.exercise_id = e.id) = 0
         OR EXISTS (SELECT 1 FROM exercise_assignments ea
                     WHERE ea.exercise_id = e.id
                       AND (ea.student_id = $1 OR ea.group_id = (SELECT group_id FROM students WHERE id = $1)))
       )
       ORDER BY e.created_at DESC`,
      [id]
    )
  )) as unknown as Row[];

  return {
    attendance: {
      total: num(attendanceRows?.total),
      present: num(attendanceRows?.present),
      absent: num(attendanceRows?.absent),
      late: num(attendanceRows?.late),
      excused: num(attendanceRows?.excused),
      rate:
        num(attendanceRows?.total) > 0
          ? Math.round(
              (100 * num(attendanceRows?.present)) / num(attendanceRows?.total)
            )
          : null,
      recent: attendanceRecent.map((r) => ({
        lesson: String(r.lesson),
        date: String(r.starts_at),
        status: String(r.status),
      })),
    },
    payments: payments.map((r) => ({
      id: String(r.id),
      amount: (r.amount as string) ?? null,
      dueDate: String(r.due_date),
      paidDate: (r.paid_date as string) ?? null,
      status: String(r.status),
      notes: (r.notes as string) ?? null,
    })),
    grades: grades.map((r) => ({
      id: String(r.id),
      assessmentId: String(r.assessment_id),
      title: String(r.title),
      type: String(r.type),
      date: String(r.date),
      score: String(r.score),
      maxScore: String(r.max_score),
      feedback: (r.feedback as string) ?? null,
    })),
    exercises: {
      completed: exerciseRows.filter((r) => r.submission_id).length,
      pending: exerciseRows.filter((r) => !r.submission_id).length,
      late: exerciseRows.filter(
        (r) => !r.submission_id && r.deadline && new Date(String(r.deadline)) < new Date()
      ).length,
      graded: exerciseRows.filter((r) => r.submission_status === "graded").length,
    },
  };
}

export function computeGradeStats(
  grades: { score: string; maxScore: string }[]
): { average: number | null; count: number } {
  if (grades.length === 0) return { average: null, count: 0 };
  const normalized: number[] = grades.map((g) => {
    const max = parseFloat(g.maxScore) || 20;
    return (parseFloat(g.score) / max) * 100;
  });
  const avg =
    normalized.reduce((a, b) => a + b, 0) / normalized.length;
  return { average: Math.round(avg * 100) / 100, count: grades.length };
}

export function assertExists<T>(value: T | null | undefined, what = "Record"): T {
  if (!value) throw new HttpError(404, `${what} not found.`);
  return value;
}

export async function q<T = Row>(
  query: string,
  params: unknown[] = []
): Promise<T[]> {
  return (await db.execute(bindParams(query, params))) as unknown as T[];
}

export async function qOne<T = Row>(
  query: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await q<T>(query, params);
  return rows[0] ?? null;
}
