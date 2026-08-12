import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    const auth = await requireAuth("any");
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.profileId, auth.id))
      .orderBy(desc(notifications.createdAt))
      .limit(40);

    return NextResponse.json(
      rows.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        isRead: n.isRead,
        createdAt: n.createdAt,
      }))
    );
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth("any");
    const body = await request.json().catch(() => ({}));
    if (body?.id) {
      const [row] = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          sql`${notifications.id} = ${body.id} AND ${notifications.profileId} = ${auth.id}`
        )
        .limit(1);
      if (!row) throw new Error("Not found");
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, body.id));
    } else {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.profileId, auth.id));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";
