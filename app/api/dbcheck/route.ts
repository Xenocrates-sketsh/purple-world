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

  return NextResponse.json(report);
}

export const dynamic = "force-dynamic";