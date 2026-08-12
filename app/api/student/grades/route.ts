import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/portal-auth";
import { q, computeGradeStats } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

type Row = Record<string, unknown>;

export async function GET() {
  try {
    const { student } = await requireStudent();

    const results = await q<Row>(
      `SELECT r.*, a.title, a.type, a.date, a.max_score, a.description
       FROM results r JOIN assessments a ON a.id = r.assessment_id
       WHERE r.student_id = $1 ORDER BY a.date DESC`,
      [student.id]
    );

    const byType: Record<string, { count: number; average: number | null; grades: { score: string; maxScore: string }[] }> = {};
    const gradesForStats: { score: string; maxScore: string }[] = [];
    for (const r of results) {
      const type = String(r.type);
      if (!byType[type]) byType[type] = { count: 0, average: null, grades: [] };
      byType[type].count += 1;
      byType[type].grades.push({ score: String(r.score), maxScore: String(r.max_score) });
      gradesForStats.push({ score: String(r.score), maxScore: String(r.max_score) });
    }

    const overall = computeGradeStats(gradesForStats);

    const byTypeSummary: Record<string, { count: number; average: number | null }> = {};
    for (const [type, v] of Object.entries(byType)) {
      const s = computeGradeStats(v.grades);
      byTypeSummary[type] = {
        count: v.count,
        average: s.average === null ? null : Math.round(s.average * 20) / 20,
      };
    }

    return NextResponse.json({
      grades: results.map((r) => ({
        id: String(r.id),
        title: String(r.title),
        type: String(r.type),
        date: String(r.date),
        score: String(r.score),
        maxScore: String(r.max_score),
        description: (r.description as string) ?? null,
        feedback: (r.feedback as string) ?? null,
      })),
      stats: {
        overall: overall.average === null ? null : Math.round(overall.average * 20) / 20,
        count: overall.count,
        byType: byTypeSummary,
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";