import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { getGroupList, q } from "@/lib/queries";
import { errorResponse } from "@/lib/http";
import { generateCode } from "@/lib/utils";

export async function GET() {
  try {
    await requireAuth("teacher");
    return NextResponse.json(await getGroupList());
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth("teacher");
    const body = await request.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    if (!name) throw new Error("Group name is required.");

    const inviteCode = await uniqueInviteCode();
    const [group] = await q<Record<string, unknown>>(
      `INSERT INTO groups (name, description, color, invite_code)
       VALUES ($1, NULLIF($2, ''), $3, $4) RETURNING *`,
      [
        name,
        String(body.description ?? ""),
        String(body.color ?? "#7c3aed"),
        inviteCode,
      ]
    );

    return NextResponse.json(
      {
        id: String(group?.id),
        name,
        description: (group?.description as string) ?? null,
        color: String(group?.color),
        inviteCode,
        memberCount: 0,
      },
      { status: 201 }
    );
  } catch (e) {
    return errorResponse(e);
  }
}

async function uniqueInviteCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateCode("PW");
    const exists = await q<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM groups WHERE invite_code = $1`,
      [code]
    );
    if (!exists[0]?.n) return code;
  }
  throw new Error("Could not generate a unique invite code.");
}

export const dynamic = "force-dynamic";