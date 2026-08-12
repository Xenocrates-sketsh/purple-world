import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { listStudents, q, qOne } from "@/lib/queries";
import { errorResponse } from "@/lib/http";
import { generateCode } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    await requireAuth("teacher");
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const filter = searchParams.get("filter") ?? "";
    const groupId = searchParams.get("groupId") ?? "";

    const students = await listStudents({
      search: search || undefined,
      filter: filter || undefined,
      groupId: groupId || undefined,
    });
    return NextResponse.json(students);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth("teacher");
    const body = await request.json().catch(() => ({}));

    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!fullName) throw new Error("Full name is required.");

    const profileId = globalThis.crypto.randomUUID();
    await q(
      `INSERT INTO profiles (id, full_name, email, avatar_url, created_at)
       VALUES ($1, $2, NULLIF($3, ''), NULL, now()) ON CONFLICT (id) DO NOTHING`,
      [profileId, fullName, email]
    );

    const studentNo = generateCode("STU");
    const [student] = await q<Record<string, unknown>>(
      `INSERT INTO students (id, profile_id, group_id, student_no, phone, parent_phone, school, stream, active, registered_at)
       VALUES (gen_random_uuid(), $1, NULLIF($2, '')::uuid, $3, NULLIF($4, ''), NULLIF($5, ''),
               NULLIF($6, ''), NULLIF($7, ''), true, now())
       RETURNING id`,
      [
        profileId,
        String(body.groupId ?? ""),
        studentNo,
        String(body.phone ?? ""),
        String(body.parentPhone ?? ""),
        String(body.school ?? ""),
        String(body.stream ?? ""),
      ]
    );

    const created = await qOne<Record<string, unknown>>(
      `SELECT s.*, p.full_name, p.email, g.name AS group_name, g.color AS group_color
       FROM students s
       JOIN profiles p ON p.id = s.profile_id
       LEFT JOIN groups g ON g.id = s.group_id
       WHERE s.id = $1`,
      [student?.id]
    );

    return NextResponse.json(
      {
        id: String(created?.id),
        profileId,
        fullName,
        email,
        avatarUrl: null,
        studentNo,
        groupId: created?.group_id ? String(created.group_id) : null,
        groupName: (created?.group_name as string) ?? null,
        groupColor: (created?.group_color as string) ?? null,
        phone: (created?.phone as string) ?? null,
        parentPhone: (created?.parent_phone as string) ?? null,
        school: (created?.school as string) ?? null,
        stream: (created?.stream as string) ?? null,
        active: true,
        registeredAt: String(created?.registered_at),
        paymentStatus: null,
        attendanceRate: null,
        unreadMessages: 0,
        pendingIdentity: !email,
      },
      { status: 201 }
    );
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";