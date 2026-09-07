import {
  addDoc,
  collection,
  doc,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
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

/** Lock a student out of the app (and their linked account's users doc so
 *  the auth gate reacts immediately). */
export async function setStudentBlocked(
  studentId: string,
  linkedUid: string | null,
  blocked: boolean
) {
  const db = getFirestoreDb();
  const batch = writeBatch(db);
  batch.update(doc(db, paths.students(studentId)), { blocked });
  if (linkedUid) {
    batch.update(doc(db, "users", linkedUid), { blocked });
  }
  await batch.commit();
}

/**
 * Move a student to a group (or remove them with null) and mirror the group
 * onto their linked login doc, so group-scoped rules and filters keep
 * working. Teacher-initiated, so the users-doc write is rules-allowed —
 * same pattern as setStudentBlocked below. Students can never write their
 * own groupId (privilege escalation), hence no client self-heal here.
 */
export async function setStudentGroup(
  studentId: string,
  groupId: string | null,
  linkedUid: string | null
) {
  const db = getFirestoreDb();
  const batch = writeBatch(db);
  batch.update(doc(db, paths.students(studentId)), { groupId });
  if (linkedUid) {
    batch.update(doc(db, "users", linkedUid), { groupId });
  }
  await batch.commit();
}

export async function setStudentLinkedUid(studentId: string, uid: string) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, paths.students(studentId)), { linkedUid: uid });
}