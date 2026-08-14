import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase";
import type { ProgramLessonDoc, ProgramUnitDoc } from "@/lib/types";
import { paths } from "./paths";

export function allUnitsQuery(db: Firestore) {
  return query(collection(db, "programUnits"), orderBy("order", "asc"));
}

export function lessonsOfUnitQuery(db: Firestore, unitId: string) {
  return query(
    collection(db, paths.programLessonsOfUnit(unitId)),
    orderBy("order", "asc")
  );
}

export async function getUnit(unitId: string) {
  const db = getFirestoreDb();
  const snap = await getDoc(doc(db, paths.programUnits(unitId)));
  return snap.exists() ? ({ id: unitId, data: snap.data() as ProgramUnitDoc } as const) : null;
}

export async function createUnit(data: Omit<ProgramUnitDoc, "createdAt">) {
  const db = getFirestoreDb();
  const ref = await addDoc(collection(db, "programUnits"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateUnit(unitId: string, patch: Partial<ProgramUnitDoc>) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, paths.programUnits(unitId)), patch);
}

export async function deleteUnit(unitId: string) {
  const db = getFirestoreDb();
  await deleteDoc(doc(db, paths.programUnits(unitId)));
}

export async function createProgramLesson(
  unitId: string,
  data: Omit<ProgramLessonDoc, "createdAt">
) {
  const db = getFirestoreDb();
  const ref = await addDoc(collection(db, paths.programLessonsOfUnit(unitId)), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProgramLesson(
  unitId: string,
  lessonId: string,
  patch: Partial<ProgramLessonDoc>
) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, paths.programLessons(unitId, lessonId)), patch);
}

export async function deleteProgramLesson(unitId: string, lessonId: string) {
  const db = getFirestoreDb();
  await deleteDoc(doc(db, paths.programLessons(unitId, lessonId)));
}

/** Move a unit to a new position (also persists the `order` field for others). */
export async function reorderUnits(items: { id: string; order: number }[]) {
  const db = getFirestoreDb();
  for (const it of items) {
    await updateDoc(doc(db, paths.programUnits(it.id)), { order: it.order });
  }
}

export async function reorderProgramLessons(
  unitId: string,
  items: { id: string; order: number }[]
) {
  const db = getFirestoreDb();
  for (const it of items) {
    await updateDoc(doc(db, paths.programLessons(unitId, it.id)), { order: it.order });
  }
}