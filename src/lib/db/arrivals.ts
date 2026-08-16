import {
  addDoc,
  collection,
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
import type { ArrivalDoc, ArrivalStatus } from "@/lib/types";
import { paths } from "./paths";
import { createStudent } from "./students";
import { makeNotification } from "./notifications";

/** Teacher: all arrivals, newest first. */
export function arrivalsQuery(db: Firestore) {
  return query(collection(db, "arrivals"), orderBy("createdAt", "desc"));
}

/** A student's own arrivals (used to reflect their request status). */
export function myArrivalQuery(db: Firestore, uid: string) {
  return query(collection(db, "arrivals"), where("uid", "==", uid));
}

export async function createArrival(data: {
  name: string;
  email: string;
  school: string | null;
  number: string | null;
  age: number | null;
  uid: string;
}) {
  const db = getFirestoreDb();
  const ref = await addDoc(collection(db, "arrivals"), {
    ...data,
    status: "pending" as ArrivalStatus,
    studentId: null,
    handledAt: null,
    handledBy: null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function setArrivalStatus(
  id: string,
  status: ArrivalStatus,
  extra?: { studentId?: string; handledBy?: string }
) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, paths.arrivals(id)), {
    status,
    handledAt: serverTimestamp(),
    handledBy: extra?.handledBy ?? null,
    studentId: extra?.studentId ?? null,
  });
}

/**
 * Teacher approves a pending request: provisions the student record, links a
 * users/{uid} profile so the anonymous student resolves to role=student, marks
 * the arrival accepted and welcomes the new student.
 */
export async function acceptArrival(id: string, arrival: ArrivalDoc, teacherUid: string) {
  const db = getFirestoreDb();
  const uid = arrival.uid;
  if (!uid) throw new Error("This arrival has no linked user.");
  if (arrival.status !== "pending") throw new Error("This arrival was already handled.");

  const studentId = await createStudent({
    name: arrival.name.trim(),
    studentNo: arrival.number?.trim() || `ARR-${id.slice(0, 6).toUpperCase()}`,
    email: arrival.email.trim().toLowerCase() || null,
    age: arrival.age,
    phone: arrival.number?.trim() || null,
    parentPhone: null,
    school: arrival.school?.trim() || null,
    stream: null,
    groupId: null,
    active: true,
    bacInfo: { year: null, targetScore: null },
    avatarUrl: null,
    registeredAt: null,
    linkedUid: uid,
    inviteCode: null,
  });

  await setDoc(doc(db, paths.users(uid)), {
    role: "student",
    email: arrival.email.trim().toLowerCase(),
    displayName: arrival.name.trim(),
    avatarUrl: null,
    studentId,
    groupId: null,
    createdAt: serverTimestamp(),
  });

  await setArrivalStatus(id, "accepted", { studentId, handledBy: teacherUid });

  await makeNotification(uid, {
    type: "new_announcement",
    title: "Welcome to Purple World!",
    body: "Your request was approved — your account is ready. Sign in with your name and email.",
    link: "/student",
  });

  return studentId;
}

export async function rejectArrival(id: string, teacherUid: string) {
  await setArrivalStatus(id, "rejected", { handledBy: teacherUid });
}