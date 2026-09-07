import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase";
import type { LessonResourceDoc } from "@/lib/types";
import { paths } from "./paths";

export function allLessonResourcesQuery(db: Firestore) {
  return query(collection(db, "lessonResources"), orderBy("createdAt", "desc"));
}

/**
 * Student-scoped reads. Firestore rules are NOT filters: a list query whose
 * rule depends on `assignedGroupIds` is DENIED outright unless the query
 * itself constrains that field to match the rule. So students read via two
 * rule-provable queries merged client-side:
 *  - `== []` mirrors `assignedGroupIds.size() == 0` (visible to all groups)
 *  - `array-contains myGroupId` mirrors `hasAny([myGroupId()])`
 * Single-field filters only — no composite index needed.
 */
export function allGroupsLessonResourcesQuery(db: Firestore) {
  // NOTE: no orderBy on purpose — where()+orderBy on different fields needs
  // a composite index that doesn't exist here. Callers sort client-side.
  // Matches rule `assignedGroupIds.size() == 0`.
  return query(collection(db, "lessonResources"), where("assignedGroupIds", "==", []));
}

export function groupLessonResourcesQuery(db: Firestore, groupId: string) {
  // NOTE: no orderBy (see above). Matches rule `hasAny([myGroupId()])`.
  return query(
    collection(db, "lessonResources"),
    where("assignedGroupIds", "array-contains", groupId)
  );
}

export async function createLessonResource(
  data: Omit<LessonResourceDoc, "createdAt">
) {
  const db = getFirestoreDb();
  const ref = await addDoc(collection(db, "lessonResources"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateLessonResource(
  lessonId: string,
  patch: Partial<LessonResourceDoc>
) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, paths.lessonResources(lessonId)), patch);
}

export async function deleteLessonResource(lessonId: string) {
  const db = getFirestoreDb();
  await deleteDoc(doc(db, paths.lessonResources(lessonId)));
}
