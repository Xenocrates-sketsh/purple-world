import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { q } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    await requireAuth("any");
    const [units, lessons] = await Promise.all([
      q<Record<string, unknown>>(
        `SELECT * FROM program_units ORDER BY position ASC, created_at ASC`
      ),
      q<Record<string, unknown>>(
        `SELECT * FROM program_lessons ORDER BY unit_id, position ASC, created_at ASC`
      ),
    ]);

    const byUnit = new Map<string, Record<string, unknown>[]>();
    for (const l of lessons) {
      const k = String(l.unit_id);
      if (!byUnit.has(k)) byUnit.set(k, []);
      byUnit.get(k)!.push(l);
    }

    return NextResponse.json(
      units.map((u) => ({
        id: String(u.id),
        title: String(u.title),
        description: (u.description as string) ?? null,
        position: Number(u.position),
        lessons: (byUnit.get(String(u.id)) ?? []).map((l) => ({
          id: String(l.id),
          unitId: String(l.unit_id),
          title: String(l.title),
          position: Number(l.position),
          content: (l.content as string) ?? "",
          grammar: (l.grammar as string) ?? "",
          vocabulary: (l.vocabulary as string) ?? "",
          reading: (l.reading as string) ?? "",
          writing: (l.writing as string) ?? "",
          listening: (l.listening as string) ?? "",
        })),
      }))
    );
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";