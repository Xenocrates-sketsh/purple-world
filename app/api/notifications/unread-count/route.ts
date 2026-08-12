import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, count, eq } from "drizzle-orm";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    const auth = await requireAuth("any");
    const [row] = await db
      .select({ value: count() })
      .from(notifications)
      .where(
        and(eq(notifications.profileId, auth.id), eq(notifications.isRead, false))
      );
    return NextResponse.json({ count: row?.value ?? 0 });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";
