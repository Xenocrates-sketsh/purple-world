import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase";

/**
 * TEMPORARY diagnostic ping (Flapper empty-lessons investigation, Sep 2026).
 * The student Lessons page calls this once its query settles so we can read
 * back exactly what the client saw: which groupId the session held, how many
 * docs the query returned, how many passed the filter, and any error code.
 * No message content, no PII beyond uid. REMOVE after diagnosis.
 */
export interface LessonsDiagnostic {
  uid: string;
  page: string;
  groupIdSeen: string | null;
  studentIdSeen: string | null;
  returned: number | null;
  visible: number | null;
  errorCode: string | null;
  bundle: string;
}

export async function pingLessonsDiagnostic(
  data: Omit<LessonsDiagnostic, "at">
): Promise<void> {
  try {
    const db = getFirestoreDb();
    await addDoc(collection(db, "diagnostics"), {
      ...data,
      at: serverTimestamp(),
    });
  } catch {
    // never break the UI for diagnostics
  }
}
