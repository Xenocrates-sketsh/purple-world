import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { q } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

export async function GET(request: Request) {
  try {
    await requireAuth("teacher");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const studentId = searchParams.get("studentId");

    let where = "";
    const params: unknown[] = [];
    if (status && status !== "all") {
      params.push(status);
      where += `${where ? " AND " : "WHERE "}pay.status = $${params.length}`;
    }
    if (studentId) {
      params.push(studentId);
      where += `${where ? " AND " : "WHERE "}pay.student_id = $${params.length}`;
    }

    const rows = await q<Record<string, unknown>>(
      `SELECT pay.*, s.active AS student_active, s.student_no,
         p.full_name, p.email
       FROM payments pay
       JOIN students s ON s.id = pay.student_id
       JOIN profiles p ON p.id = s.profile_id
       ${where}
       ORDER BY pay.due_date DESC LIMIT 500`,
      params
    );

    return NextResponse.json(
      rows.map((r) => ({
        id: String(r.id),
        studentId: String(r.student_id),
        amount: (r.amount as string) ?? null,
        dueDate: String(r.due_date),
        paidDate: (r.paid_date as string) ?? null,
        status: String(r.status),
        notes: (r.notes as string) ?? null,
        createdAt: String(r.created_at),
        student: {
          id: String(r.student_id),
          fullName: String(r.full_name),
          email: String(r.email),
          studentNo: String(r.student_no),
          active: Boolean(r.student_active),
        },
      }))
    );
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth("teacher");
    const body = await request.json().catch(() => ({}));
    const studentId = String(body.studentId ?? "");
    const dueDate = String(body.dueDate ?? "");
    if (!studentId || !dueDate) throw new Error("Student and due date are required.");

    const amount = body.amount === "" || body.amount === null || body.amount === undefined
      ? null
      : Number(body.amount);
    const paidDate = body.paidDate ? String(body.paidDate) : null;

    const [payment] = await q<Record<string, unknown>>(
      `INSERT INTO payments (student_id, amount, due_date, paid_date, status, notes)
       VALUES ($1, $2, $3, $4,
               CASE WHEN $4 IS NOT NULL THEN 'paid' ELSE 'due' END,
               NULLIF($5,''))
       RETURNING *`,
      [studentId, amount, dueDate, paidDate, String(body.notes ?? "")]
    );

    return NextResponse.json(
      {
        id: String(payment?.id),
        studentId,
        amount: (payment?.amount as string) ?? null,
        dueDate: String(payment?.due_date),
        paidDate: (payment?.paid_date as string) ?? null,
        status: String(payment?.status),
        notes: (payment?.notes as string) ?? null,
      },
      { status: 201 }
    );
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";