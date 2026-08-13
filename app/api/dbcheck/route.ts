import { NextResponse } from "next/server";

export async function GET() {
  const report: Record<string, unknown> = {
    netlifyDbUrl: Boolean(process.env.NETLIFY_DB_URL),
    databaseUrl: Boolean(process.env.NETLIFY_DATABASE_URL),
    netlifyDbDriver: process.env.NETLIFY_DB_DRIVER ?? null,
    urlHost: process.env.NETLIFY_DB_URL
      ? new URL(process.env.NETLIFY_DB_URL).host
      : null,
  };

  try {
    const { db } = await import("@/db");
    const { sql } = await import("drizzle-orm");
    const res = await db.execute(sql`SELECT 1 AS ok`);
    report.execSql = { ok: JSON.stringify((res as { rows?: unknown[] }).rows) };
  } catch (e) {
    report.execSqlError = e instanceof Error ? e.message : String(e);
  }

  try {
    const { db } = await import("@/db");
    const { sql } = await import("drizzle-orm");
    const res = await db.execute(
      sql.join([
        sql.raw("SELECT "),
        sql.param("1" as never),
        sql.raw(" AS ok"),
      ])
    );
    report.execJoin = { ok: JSON.stringify((res as { rows?: unknown[] }).rows) };
  } catch (e) {
    report.execJoinError = e instanceof Error ? e.message : String(e);
  }

  try {
    const { q } = await import("@/lib/queries");
    const rows = await q(`SELECT COUNT(*)::int AS n FROM students`);
    report.queryLib = rows;
  } catch (e) {
    report.queryLibError = e instanceof Error ? e.message : String(e);
  }

  try {
    const { q } = await import("@/lib/queries");
    const rows = await q(
      `SELECT COUNT(*)::int AS n FROM messages m
       JOIN profiles p ON p.id = m.sender_id
       JOIN students s ON s.profile_id = m.sender_id
       WHERE m.recipient_id = $1 AND m.read_at IS NULL`,
      ["993713cd-cdc6-4fb3-98bc-f1f64b557888"]
    );
    report.queryLibParam = rows;
  } catch (e) {
    report.queryLibParamError = e instanceof Error ? e.message : String(e);
  }

  try {
    const { db } = await import("@/db");
    const { profiles } = await import("@/db/schema");
    const rows = await db.select().from(profiles).limit(1);
    report.drizzleSelect = { ok: rows.length };
  } catch (e) {
    report.drizzleSelectError = e instanceof Error ? e.message : String(e);
  }

  try {
    const { q } = await import("@/lib/queries");
    const q1 = await q(
      `SELECT
         (SELECT COUNT(*)::int FROM students) AS students,
         (SELECT COUNT(*)::int FROM students WHERE active = true) AS active,
         (SELECT COUNT(DISTINCT s.id)::int FROM students s
            WHERE s.active = true AND EXISTS (
              SELECT 1 FROM payments pay
              WHERE pay.student_id = s.id AND pay.paid_date IS NULL AND pay.status IN ('due','overdue'))) AS unpaid,
         (SELECT COUNT(DISTINCT s.id)::int FROM students s
            WHERE s.active = true AND EXISTS (
              SELECT 1 FROM payments pay
              WHERE pay.student_id = s.id AND pay.paid_date IS NULL AND pay.status = 'overdue')) AS overdue`
    );
    report.dashTotals = JSON.stringify(q1);
  } catch (e) {
    report.dashTotalsError = e instanceof Error ? e.message : String(e);
  }

  try {
    const { listStudents } = await import("@/lib/queries");
    const students = await listStudents({});
    report.listStudents = { count: students.length };
  } catch (e) {
    report.listStudentsError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(report);
}

export const dynamic = "force-dynamic";