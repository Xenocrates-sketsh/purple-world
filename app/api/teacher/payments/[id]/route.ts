import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { q, assertExists } from "@/lib/queries";
import { errorResponse } from "@/lib/http";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth("teacher");
    const [payment] = await q<Record<string, unknown>>(
      `SELECT * FROM payments WHERE id = $1`,
      [params.id]
    );
    assertExists(payment, "Payment");
    const body = await request.json().catch(() => ({}));

    const amount = body.amount === undefined || body.amount === "" ? payment.amount : Number(body.amount);
    const dueDate = body.dueDate ?? String(payment.due_date);
    const paidDate =
      body.paidDate === undefined ? payment.paid_date : body.paidDate ? String(body.paidDate) : null;
    const notes = body.notes === undefined ? payment.notes : String(body.notes);

    const status = paidDate ? "paid" : deriveStatus(String(dueDate));

    await q(
      `UPDATE payments SET amount = $1, due_date = $2, paid_date = $3, status = $4, notes = $5
       WHERE id = $6`,
      [amount, dueDate, paidDate, status, notes, params.id]
    );

    return NextResponse.json({ ok: true, status });
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
    assertExists(
      await q<Record<string, unknown>>(`SELECT id FROM payments WHERE id = $1`, [params.id]),
      "Payment"
    );
    await q(`DELETE FROM payments WHERE id = $1`, [params.id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

function deriveStatus(dueDate: string): "due" | "overdue" {
  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);
  return due.getTime() < Date.now() ? "overdue" : "due";
}

export const dynamic = "force-dynamic";