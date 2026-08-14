import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase";
import type { ExerciseDoc, SubmissionDoc } from "@/lib/types";
import { paths } from "./paths";

export function allExercisesQuery(db: Firestore) {
  return query(collection(db, "exercises"), orderBy("createdAt", "desc"));
}

export function submissionsOfExerciseQuery(db: Firestore, exerciseId: string) {
  return query(collection(db, paths.submissionsOfExercise(exerciseId)));
}

/** A student's submissions (collectionGroup; index studentId). */
export function studentSubmissionsQuery(db: Firestore, studentId: string) {
  return query(
    collectionGroup(db, "submissions"),
    where("studentId", "==", studentId)
  );
}

export async function createExercise(data: Omit<ExerciseDoc, "createdAt">) {
  const db = getFirestoreDb();
  const ref = await addDoc(collection(db, "exercises"), data);
  return ref.id;
}

export async function updateExercise(exerciseId: string, patch: Partial<ExerciseDoc>) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, paths.exercises(exerciseId)), patch);
}

export async function deleteExercise(exerciseId: string) {
  const db = getFirestoreDb();
  await deleteDoc(doc(db, paths.exercises(exerciseId)));
}

export async function setExerciseArchived(exerciseId: string, archived: boolean) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, paths.exercises(exerciseId)), { archived });
}

/** Submit text and/or an attachment. Re-submitting overwrites the student's own doc. */
export async function upsertSubmission(
  exerciseId: string,
  studentId: string,
  data: Partial<Pick<SubmissionDoc, "content" | "attachmentUrl">> & { status: SubmissionDoc["status"] }
) {
  const db = getFirestoreDb();
  await setDoc(doc(db, paths.submissions(exerciseId, studentId)), {
    ...data,
    studentId,
    submittedAt: serverTimestamp(),
  }, { merge: true });
}

export async function gradeSubmission(
  exerciseId: string,
  studentId: string,
  grade: number,
  feedback: string | null
) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, paths.submissions(exerciseId, studentId)), {
    grade,
    feedback,
    status: "graded",
    gradedAt: serverTimestamp(),
  });
}