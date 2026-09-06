import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase";
import type { LessonResourceDoc } from "@/lib/types";
import { paths } from "./paths";

export function allLessonResourcesQuery(db: Firestore) {
  return query(collection(db, "lessonResources"), orderBy("createdAt", "desc"));
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
