import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();

/**
 * deleteStudent — teacher-only account removal.
 *
 * Removes, in order:
 *   1. Teacher's private notes (notes/{studentId}/entries/*)
 *   2. The students/{studentId} record
 *   3. The users/{uid} profile (if an account was ever linked)
 *   4. The Firebase Auth login (if an account was ever linked)
 *
 * Chat history is intentionally kept so past conversations stay readable.
 * Deploy: `firebase deploy --only functions` (requires Blaze plan).
 */
export const deleteStudent = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in first.");
  }
  const db = getFirestore();
  const callerUid = request.auth.uid;

  const callerSnap = await db.collection("users").doc(callerUid).get();
  const isTeacher =
    callerSnap.get("role") === "teacher" ||
    (request.auth.token as { role?: unknown }).role === "teacher";
  if (!isTeacher) {
    throw new HttpsError("permission-denied", "Teachers only.");
  }

  const { studentId } = (request.data ?? {}) as { studentId?: unknown };
  if (typeof studentId !== "string" || !studentId) {
    throw new HttpsError("invalid-argument", "studentId is required.");
  }

  const studentRef = db.collection("students").doc(studentId);
  const snap = await studentRef.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Student not found.");
  }
  const linkedUid = (snap.get("linkedUid") as string | null) ?? null;

  // 1. Private notes entries (top-level notes/{studentId}/entries).
  const entries = await db
    .collection("notes")
    .doc(studentId)
    .collection("entries")
    .get();
  if (!entries.empty) {
    const batch = db.batch();
    entries.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  // 2. Student record.
  await studentRef.delete();

  // 3 + 4. Profile + login (only when an account was linked).
  if (linkedUid) {
    await db.collection("users").doc(linkedUid).delete().catch(() => undefined);
    await getAuth().deleteUser(linkedUid).catch(() => undefined);
  }

  return { ok: true, studentId };
});
