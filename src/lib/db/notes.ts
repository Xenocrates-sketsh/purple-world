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
import { paths } from "./paths";

export function notesQuery(db: Firestore, studentId: string) {
  return query(
    collection(db, paths.notesOf(studentId)),
    orderBy("updatedAt", "desc")
  );
}

export async function addNote(studentId: string, content: string) {
  const db = getFirestoreDb();
  await addDoc(collection(db, paths.notesOf(studentId)), {
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateNote(studentId: string, entryId: string, content: string) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, paths.notes(studentId, entryId)), {
    content,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNote(studentId: string, entryId: string) {
  const db = getFirestoreDb();
  await deleteDoc(doc(db, paths.notes(studentId, entryId)));
}