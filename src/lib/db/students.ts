import {
  addDoc,
  collection,
  doc,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase";
import type { StudentDoc } from "@/lib/types";
import { paths } from "./paths";

export function allStudentsQuery(db: Firestore) {
  return query(collection(db, "students"), orderBy("name", "asc"));
}

/** Requires Firestore composite index `students: groupId ASC, name ASC`. */
export function studentsByGroupQuery(db: Firestore, groupId: string) {
  return query(
    collection(db, "students"),
    where("groupId", "==", groupId),
    orderBy("name", "asc")
  );
}

export async function createStudent(data: Omit<StudentDoc, "createdAt">) {
  const db = getFirestoreDb();
  const ref = await addDoc(collection(db, "students"), data);
  return ref.id;
}

/** Provides a pre-known id (used to link a record created beforehand). */
export async function setStudentWithId(studentId: string, data: unknown) {
  const db = getFirestoreDb();
  await setDoc(doc(db, paths.students(studentId)), data);
}

export async function updateStudent(studentId: string, patch: Partial<StudentDoc>) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, paths.students(studentId)), patch);
}

export async function setStudentActive(studentId: string, active: boolean) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, paths.students(studentId)), { active });
}

export async function setStudentGroup(studentId: string, groupId: string | null) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, paths.students(studentId)), { groupId });
}

export async function setStudentLinkedUid(studentId: string, uid: string) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, paths.students(studentId)), { linkedUid: uid });
}