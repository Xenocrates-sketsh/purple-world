import { NextResponse } from "next/server";
import { requireStudent } from "@/lib/portal-auth";
import { q } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    const { student } = await requireStudent();
    const rows = await q<Record<string, unknown>>(
      `SELECT * FROM payments WHERE student_id = $1 ORDER BY due_date DESC`,
      [student.id]
    );

    const current = rows.find((r) => !r.paid_date) ?? null;

    return NextResponse.json({
      current: current
        ? {
            id: String(current.id),
            amount: (current.amount as string) ?? null,
            dueDate: String(current.due_date),
            paidDate: (current.paid_date as string) ?? null,
            status: String(current.status),
            notes: (current.notes as string) ?? null,
          }
        : null,
      history: rows.map((r) => ({
        id: String(r.id),
        amount: (r.amount as string) ?? null,
        dueDate: String(r.due_date),
        paidDate: (r.paid_date as string) ?? null,
        status: String(r.status),
        notes: (r.notes as string) ?? null,
      })),
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";