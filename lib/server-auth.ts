import { cookies } from "next/headers";
import { db } from "@/db";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export type AuthContext = {
  id: string;
  email: string;
  fullName: string;
  role: "teacher" | "student";
  studentId: string | null;
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function rolesFromClaims(claims: Record<string, unknown>): string[] {
  const meta = (claims.app_metadata ?? {}) as Record<string, unknown>;
  const roles = Array.isArray(meta.roles) ? meta.roles : [];
  return roles.map(String);
}

export async function getAuthContext(): Promise<AuthContext | null> {
  let token: string | null = null;
  try {
    token = cookies().get("nf_jwt")?.value ?? null;
  } catch {
    /* not in a request scope */
  }
  if (!token) return null;

  const claims = decodeJwtPayload(token);
  if (!claims) return null;

  const roles = rolesFromClaims(claims);
  const role: "teacher" | "student" | null = roles.includes("teacher")
    ? "teacher"
    : roles.includes("student")
      ? "student"
      : null;
  if (!role) return null;

  const id = String(claims.sub ?? "");
  if (!id) return null;

  const email = String(claims.email ?? "");

  const umeta = (claims.user_metadata ?? {}) as Record<string, unknown>;
  const fullName =
    String(claims.name ?? "") ||
    String(umeta?.full_name ?? "") ||
    String(umeta?.name ?? "") ||
    email ||
    "User";

  let studentId: string | null = null;
  if (role === "student") {
    const [student] = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.profileId, id))
      .limit(1);
    studentId = student?.id ?? null;
  }

  return { id, email, fullName, role, studentId };
}

export async function requireAuth(
  role: "teacher" | "student" | "any"
): Promise<AuthContext> {
  const auth = await getAuthContext();
  if (!auth) throw new HttpError(401, "Authentication required.");
  if (role !== "any" && auth.role !== role)
    throw new HttpError(403, "You do not have permission to do this.");
  return auth;
}