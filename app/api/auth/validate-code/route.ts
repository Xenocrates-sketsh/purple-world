import { NextResponse } from "next/server";
import { db } from "@/db";
import { groups } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { errorResponse } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = (searchParams.get("code") ?? "").trim().toUpperCase();
    if (!code) {
      return NextResponse.json(
        { error: "Please enter a group code." },
        { status: 400 }
      );
    }
    const [group] = await db
      .select({
        id: groups.id,
        name: groups.name,
        color: groups.color,
        memberCount: sql<number>`(SELECT COUNT(*)::int FROM students WHERE students.group_id = ${groups.id})`,
      })
      .from(groups)
      .where(eq(groups.inviteCode, code))
      .limit(1);

    if (!group) {
      return NextResponse.json(
        { error: "That code is not valid." },
        { status: 404 }
      );
    }
    return NextResponse.json(group);
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";
