import { requireAuth, HttpError, type AuthContext } from "@/lib/server-auth";
import { q } from "@/lib/queries";

export interface StudentContext {
  auth: AuthContext;
  student: {
    id: string;
    profileId: string;
    groupId: string | null;
    studentNo: string;
    active: boolean;
  };
}

export async function requireStudent(): Promise<StudentContext> {
  const auth = await requireAuth("student");
  const rows = await q<Record<string, unknown>>(
    `SELECT s.id, s.profile_id, s.group_id, s.student_no, s.active
     FROM students s WHERE s.profile_id = $1 LIMIT 1`,
    [auth.id]
  );
  const student = rows[0];
  if (!student) throw new HttpError(403, "Student profile not found.");
  return {
    auth,
    student: {
      id: String(student.id),
      profileId: String(student.profile_id),
      groupId: student.group_id ? String(student.group_id) : null,
      studentNo: String(student.student_no),
      active: Boolean(student.active),
    },
  };
}
