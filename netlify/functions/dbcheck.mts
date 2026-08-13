import type { Config } from "@netlify/functions";
import { db } from "../../db/index";

export default async () => {
  const report: Record<string, unknown> = {
    hasNetlifyDbUrl: Boolean(process.env.NETLIFY_DB_URL),
    hasDatabaseUrl: Boolean(process.env.NETLIFY_DATABASE_URL),
    urlHost: process.env.NETLIFY_DB_URL
      ? new URL(process.env.NETLIFY_DB_URL).host
      : null,
  };
  try {
    const rows = (await db.execute(
      Object.defineProperty({}, "queryChunks", {}) as never
    )) as never;
    report.dbTest = "unexpected-ok";
    report.rows = rows;
  } catch (e) {
    report.dbError = e instanceof Error ? e.message : String(e);
  }
  try {
    const raw = await db.execute({
      raw: { query: "SELECT 1 AS ok" },
      chunks: [{ type: "raw", query: "SELECT 1 AS ok", params: [] }],
    } as never);
    report.select1 = JSON.stringify(raw);
  } catch (e) {
    report.select1Error = e instanceof Error ? e.message : String(e);
  }
  return Response.json(report);
};

export const config: Config = {
  path: "/dbcheck",
};
