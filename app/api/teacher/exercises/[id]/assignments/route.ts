import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { q, assertExists, setAssignments } from "@/lib/queries";
import { errorResponse } from "@/lib/http";
import { notify } from "@/lib/notify";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth("teacher");
    const [exercise] = await q<Record<string, unknown>>(
      `SELECT * FROM exercises WHERE id = $1`,
      [params.id]
    );
    assertExists(exercise, "Exercise");
    const body = await request.json().catch(() => ({}));

    await setAssignments(params.id, body);

    // Notify targeted students about the new exercise.
    const title = String(exercise.title);
    const type = "new_exercise" as const;
    const links = [
      ...(Array.isArray(body.studentIds) ? body.studentIds : []),
    ];
    const groupIds = Array.isArray(body.groupIds) ? body.groupIds : [];

    // Notify individual students.
    for (const sid of links) {
      const [st] = await q<Record<string, unknown>>(
        `SELECT profile_id FROM students WHERE id = $1`,
        [sid]
      );
      if (st)
        await notify(
          String(st.profile_id),
          type,
          `New exercise: ${title}`,
          `A new exercise has been assigned to you.`,
          "/student/exercises"
        );
    }
    // Notify all members of targeted groups.
    if (groupIds.length > 0) {
      const members = await q<{ profile_id: string }>(
        `SELECT s.profile_id FROM students s WHERE s.group_id = ANY($1::uuid[]) AND s.active = true`,
        [groupIds]
      );
      for (const m of members) {
        await notify(
          String(m.profile_id),
          type,
          `New exercise: ${title}`,
          `A new exercise has been assigned to your group.`,
          "/student/exercises"
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";