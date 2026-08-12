import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { q, assertExists } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth("teacher");
    assertExists(
      await q<Record<string, unknown>>(`SELECT id FROM program_units WHERE id = $1`, [params.id]),
      "Unit"
    );
    const body = await request.json().catch(() => ({}));
    const title = String(body.title ?? "").trim();
    if (!title) throw new Error("Lesson title is required.");

    const [lesson] = await q<Record<string, unknown>>(
      `INSERT INTO program_lessons (unit_id, title, position, content, grammar, vocabulary, reading, writing, listening)
       VALUES ($1, $2, COALESCE($3, (SELECT COALESCE(MAX(position),0)+1 FROM program_lessons WHERE unit_id = $1)),
               NULLIF($4,''), NULLIF($5,''), NULLIF($6,''), NULLIF($7,''), NULLIF($8,''), NULLIF($9,''))
       RETURNING *`,
      [
        params.id,
        title,
        body.position === undefined ? null : Number(body.position),
        String(body.content ?? ""),
        String(body.grammar ?? ""),
        String(body.vocabulary ?? ""),
        String(body.reading ?? ""),
        String(body.writing ?? ""),
        String(body.listening ?? ""),
      ]
    );

    return NextResponse.json(
      {
        id: String(lesson?.id),
        unitId: String(lesson?.unit_id),
        title,
        position: Number(lesson?.position),
        content: (lesson?.content as string) ?? "",
        grammar: (lesson?.grammar as string) ?? "",
        vocabulary: (lesson?.vocabulary as string) ?? "",
        reading: (lesson?.reading as string) ?? "",
        writing: (lesson?.writing as string) ?? "",
        listening: (lesson?.listening as string) ?? "",
      },
      { status: 201 }
    );
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";