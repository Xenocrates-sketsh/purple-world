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
import type { AssessmentDoc, AssessmentResultDoc } from "@/lib/types";
import { paths } from "./paths";

export function allAssessmentsQuery(db: Firestore) {
  return query(collection(db, "assessments"), orderBy("date", "desc"));
}

export function assessmentsByGroupQuery(db: Firestore, groupId: string) {
  return query(
    collection(db, "assessments"),
    where("groupId", "==", groupId),
    orderBy("date", "desc")
  );
}

export function resultsOfAssessmentQuery(db: Firestore, assessmentId: string) {
  return query(collection(db, paths.resultsOfAssessment(assessmentId)));
}

/** Student's own results across assessments (collectionGroup; index studentId). */
export function studentResultsQuery(db: Firestore, studentId: string) {
  return query(
    collectionGroup(db, "results"),
    where("studentId", "==", studentId),
    orderBy("createdAt", "desc")
  );
}

export async function createAssessment(data: Omit<AssessmentDoc, "createdAt">) {
  const db = getFirestoreDb();
  const ref = await addDoc(collection(db, "assessments"), data);
  return ref.id;
}

export async function updateAssessment(assessmentId: string, patch: Partial<AssessmentDoc>) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, paths.assessments(assessmentId)), patch);
}

export async function deleteAssessment(assessmentId: string) {
  const db = getFirestoreDb();
  await deleteDoc(doc(db, paths.assessments(assessmentId)));
}

/** Upsert one student's result (doc id = studentId). */
export async function setResult(
  assessmentId: string,
  studentId: string,
  data: Omit<AssessmentResultDoc, "createdAt">
) {
  const db = getFirestoreDb();
  await setDoc(doc(db, paths.results(assessmentId, studentId)), {
    ...data,
    studentId,
    assessmentId,
    createdAt: serverTimestamp(),
  });
}