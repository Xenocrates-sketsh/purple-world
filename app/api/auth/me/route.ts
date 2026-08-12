import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server-auth";
import { errorResponse } from "@/lib/http";

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    return NextResponse.json({
      id: auth.id,
      email: auth.email,
      fullName: auth.fullName,
      role: auth.role,
      studentId: auth.studentId,
    });
  } catch (e) {
    return errorResponse(e);
  }
}

export const dynamic = "force-dynamic";
