import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import {
  getStudentById,
  getStudentStats,
  computeGradeStats,
  assertExists,
  q,
  qOne,
} from "@/lib/queries";
import { errorResponse } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth("teacher");
    const [student, stats, note] = await Promise.all([
      getStudentById(params.id),
      getStudentStats(params.id),
      qOne<Record<string, unknown>>(
        `SELECT content FROM teacher_notes WHERE student_id = $1`,
        [params.id]
      ),
    ]);
    const s = assertExists(student, "Student");

    const gradeStats = computeGradeStats(
      stats.grades.map((g) => ({ score: g.score, maxScore: g.maxScore }))
    );

    return NextResponse.json({
      id: String(s.id),
      profileId: String(s.profile_id),
      fullName: String(s.full_name ?? ""),
      email: String(s.email ?? ""),
      avatarUrl: (s.avatar_url as string) ?? null,
      studentNo: String(s.student_no),
      groupId: s.group_id ? String(s.group_id) : null,
      groupName: (s.group_name as string) ?? null,
      groupColor: (s.group_color as string) ?? null,
      phone: (s.phone as string) ?? null,
      parentPhone: (s.parent_phone as string) ?? null,
      school: (s.school as string) ?? null,
      stream: (s.stream as string) ?? null,
      active: Boolean(s.active),
      registeredAt: String(s.registered_at),
      paymentStatus: (s.payment_status as string) ?? null,
      notes: (note?.content as string) ?? "",
      stats: {
        ...stats,
        gradeStats: {
          average: gradeStats.average ? Math.round(gradeStats.average * 20) / 20 : null,
          count: gradeStats.count,
        },
      },
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
    const s = assertExists(await getStudentById(params.id), "Student");
    const body = await request.json().catch(() => ({}));

    await q(
      `UPDATE profiles SET
         full_name = COALESCE(NULLIF($1,''), full_name),
         email = COALESCE(NULLIF($2,''), email)
       WHERE id = $3`,
      [String(body.fullName ?? ""), String(body.email ?? ""), String(s.profile_id)]
    );

    await q(
      `UPDATE students SET
         group_id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END,
         phone = COALESCE(NULLIF($2,''), phone),
         parent_phone = COALESCE(NULLIF($3,''), parent_phone),
         school = COALESCE(NULLIF($4,''), school),
         stream = COALESCE(NULLIF($5,''), stream),
         active = COALESCE($6, active)
       WHERE id = $7`,
      [
        String(body.groupId ?? ""),
        String(body.phone ?? ""),
        String(body.parentPhone ?? ""),
        String(body.school ?? ""),
        String(body.stream ?? ""),
        body.active === undefined ? null : Boolean(body.active),
        params.id,
      ]
    );

    const updated = assertExists(await getStudentById(params.id), "Student");
    return NextResponse.json({ ok: true, id: params.id, groupId: updated.group_id ? String(updated.group_id) : null, active: Boolean(updated.active) });
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
    assertExists(await getStudentById(params.id), "Student");
    await q(`UPDATE students SET active = false WHERE id = $1`, [params.id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";