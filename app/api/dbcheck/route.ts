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

  return NextResponse.json(report);
}

export const dynamic = "force-dynamic";