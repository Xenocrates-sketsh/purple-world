import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  orderBy,
  query,
  updateDoc,
  writeBatch,
  collectionGroup,
  serverTimestamp,
  where,
  setDoc,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase";
import type { AttendanceDoc, AttendanceStatus, LessonDoc } from "@/lib/types";
import { paths } from "./paths";

export function allLessonsQuery(db: Firestore) {
  return query(collection(db, "lessons"), orderBy("startsAt", "desc"));
}

export function lessonsByGroupQuery(db: Firestore, groupId: string) {
  // NOTE: no orderBy — where()+orderBy on different fields needs a composite
  // index that doesn't exist here. Callers sort client-side.
  return query(collection(db, "lessons"), where("groupId", "==", groupId));
}

/** Multi-group variant for teacher filters (`in` caps at 30 ids). */
export function lessonsByGroupsQuery(db: Firestore, groupIds: string[]) {
  return query(collection(db, "lessons"), where("groupId", "in", groupIds.slice(0, 30)));
}

export async function createLesson(data: Omit<LessonDoc, "createdAt">) {
  const db = getFirestoreDb();
  const ref = await addDoc(collection(db, "lessons"), data);
  return ref.id;
}

export async function updateLesson(lessonId: string, patch: Partial<LessonDoc>) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, paths.lessons(lessonId)), patch);
}

export async function deleteLesson(lessonId: string) {
  const db = getFirestoreDb();
  await deleteDoc(doc(db, paths.lessons(lessonId)));
}

/** Attendance follows `lessons/{lessonId}/attendance/{studentId}`. */
export function attendanceOfLessonQuery(db: Firestore, lessonId: string) {
  return query(collection(db, paths.attendanceOfLesson(lessonId)));
}

/** All attendance for a student (collection group query; needs index studentId+markedAt). */
export function studentAttendanceQuery(db: Firestore, studentId: string) {
  return query(
    collectionGroup(db, "attendance"),
    where("studentId", "==", studentId)
  );
}

export async function setAttendance(
  lessonId: string,
  studentId: string,
  status: AttendanceStatus
) {
  const db = getFirestoreDb();
  await setDoc(doc(db, paths.attendance(lessonId, studentId)), {
    status,
    markedAt: serverTimestamp(),
  });
}

export async function markAttendanceForLesson(
  lessonId: string,
  students: { studentId: string; status: AttendanceStatus }[]
) {
  const db = getFirestoreDb();
  const batch = writeBatch(db);
  for (const s of students) {
    batch.set(doc(db, paths.attendance(lessonId, s.studentId)), {
      studentId: s.studentId,
      status: s.status,
      markedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

export async function getAttendance(lessonId: string, studentId: string) {
  const db = getFirestoreDb();
  const snap = await getDoc(doc(db, paths.attendance(lessonId, studentId)));
  return snap.exists() ? (snap.data() as AttendanceDoc) : null;
}