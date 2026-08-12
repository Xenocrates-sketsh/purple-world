import { getUser } from "@netlify/identity";
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

export async function getAuthContext(): Promise<AuthContext | null> {
  const user = await getUser();
  if (!user) return null;

  const roles = user.roles ?? [];
  const role: "teacher" | "student" | null = roles.includes("teacher")
    ? "teacher"
    : roles.includes("student")
      ? "student"
      : null;
  if (!role) return null;

  const fullName =
    (user.name as string) ||
    (user.userMetadata?.full_name as string) ||
    user.email ||
    "User";

  let studentId: string | null = null;
  if (role === "student") {
    const [student] = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.profileId, user.id))
      .limit(1);
    studentId = student?.id ?? null;
  }

  return { id: user.id, email: user.email ?? "", fullName, role, studentId };
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
