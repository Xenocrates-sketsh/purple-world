import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { q, assertExists, bindParams } from "@/lib/queries";
import { db } from "@/db";
import { errorResponse } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth("teacher");
    const [lesson] = await q<Record<string, unknown>>(
      `SELECT l.*, g.name AS group_name, g.color AS group_color
       FROM lessons l JOIN groups g ON g.id = l.group_id WHERE l.id = $1`,
      [params.id]
    );
    assertExists(lesson, "Lesson");

    const [students, records] = await Promise.all([
      q<Record<string, unknown>>(
        `SELECT s.id, p.full_name
         FROM students s JOIN profiles p ON p.id = s.profile_id
         WHERE s.group_id = $1 AND s.active = true ORDER BY p.full_name`,
        [String(lesson.group_id)]
      ),
      q<Record<string, unknown>>(
        `SELECT * FROM attendance WHERE lesson_id = $1`,
        [params.id]
      ),
    ]);

    const recordMap = new Map(
      records.map((r) => [String(r.student_id), String(r.status)])
    );

    return NextResponse.json({
      lesson: {
        id: String(lesson.id),
        title: String(lesson.title),
        startsAt: String(lesson.starts_at),
        groupName: String(lesson.group_name),
      },
      students: students.map((s) => ({
        id: String(s.id),
        fullName: String(s.full_name),
        status: recordMap.get(String(s.id)) ?? null,
      })),
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth("teacher");
    const [lesson] = await q<Record<string, unknown>>(
      `SELECT id, group_id FROM lessons WHERE id = $1`,
      [params.id]
    );
    assertExists(lesson, "Lesson");

    const body = await request.json().catch(() => ({}));
    const records = Array.isArray(body.records) ? body.records : [];
    const valid = ["present", "absent", "late", "excused"];
    const groupId = String(lesson.group_id);

    // Verify every student belongs to the lesson's group.
    const members = await q<Record<string, unknown>>(
      `SELECT id FROM students WHERE group_id = $1 AND active = true`,
      [groupId]
    );
    const memberIds = new Set(members.map((m) => String(m.id)));

    const studentIds: string[] = [];
    for (const rec of records) {
      const sid = String(rec.studentId ?? "");
      const status = String(rec.status ?? "");
      if (!sid || !memberIds.has(sid)) throw new Error("Invalid student in attendance.");
      if (!valid.includes(status)) throw new Error("Invalid attendance status.");
      studentIds.push(sid);
    }

    // Reset existing attendance for this lesson, then write fresh records.
    await db.transaction(async (tx) => {
      await tx.execute(bindParams(`DELETE FROM attendance WHERE lesson_id = $1`, [params.id]));
      for (const rec of records) {
        await tx.execute(
          bindParams(
            `INSERT INTO attendance (lesson_id, student_id, status, marked_at)
             VALUES ($1, $2, $3, now())`,
            [params.id, String(rec.studentId), String(rec.status)]
          )
        );
      }
    });

    return NextResponse.json({ ok: true, marked: studentIds.length });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";