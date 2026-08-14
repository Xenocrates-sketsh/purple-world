import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase";
import type { GroupDoc } from "@/lib/types";
import { paths } from "./paths";

export function allGroupsQuery(db: Firestore) {
  return query(collection(db, "groups"), orderBy("name", "asc"));
}

export async function getGroup(groupId: string) {
  const db = getFirestoreDb();
  const snap = await getDoc(doc(db, paths.groups(groupId)));
  return snap.exists() ? ({ id: snap.id, data: snap.data() as GroupDoc } as const) : null;
}

export async function createGroup(data: Omit<GroupDoc, "createdAt">) {
  const db = getFirestoreDb();
  const ref = await addDoc(collection(db, "groups"), data);
  return ref.id;
}

export async function setGroupWithId(groupId: string, data: unknown) {
  const db = getFirestoreDb();
  await setDoc(doc(db, paths.groups(groupId)), data);
}

export async function updateGroup(groupId: string, patch: Partial<GroupDoc>) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, paths.groups(groupId)), patch);
}

export async function deleteGroup(groupId: string) {
  const db = getFirestoreDb();
  await deleteDoc(doc(db, paths.groups(groupId)));
}