import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/portal-auth";
import { q } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

export async function PATCH(request: Request) {
  try {
    const { student } = await requireStudent();
    const body = await request.json().catch(() => ({}));

    const patches = new Map<string, string>();
    for (const key of ["phone", "parentPhone", "school", "stream", "fullName"]) {
      const raw = body[key];
      if (raw !== undefined && typeof raw === "string") {
        patches.set(key, raw.trim());
      }
    }

    const set: string[] = [];
    const params: unknown[] = [];
    for (const [key, value] of Array.from(patches)) {
      if (key === "fullName") continue;
      params.push(value || null);
      set.push(`${key === "parentPhone" ? "parent_phone" : key} = $${params.length}`);
    }

    if (set.length > 0) {
      params.push(student.id);
      await q(
        `UPDATE students SET ${set.join(", ")} WHERE id = $${params.length}`,
        params
      );
    }

    const fullName = patches.get("fullName");
    if (fullName) {
      await q(`UPDATE profiles SET full_name = $1 WHERE id = $2`, [
        fullName,
        student.profileId,
      ]);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";