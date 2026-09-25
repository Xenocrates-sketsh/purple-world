import { httpsCallable } from "firebase/functions";

import { getFirebaseFunctions } from "@/lib/firebase";

/**
 * Permanently delete a student: private notes, student record, profile
 * and login. Teacher-only — enforced inside the Cloud Function.
 * Chat history is intentionally kept.
 */
export async function deleteStudentAccount(studentId: string): Promise<void> {
  const fn = httpsCallable<{ studentId: string }, { ok: boolean }>(
    getFirebaseFunctions(),
    "deleteStudent"
  );
  await fn({ studentId });
}
