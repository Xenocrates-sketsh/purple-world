import {
  collection,
  doc,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase";
import type { NotificationDoc } from "@/lib/types";
import { paths } from "./paths";

export function notificationsQuery(db: Firestore, uid: string) {
  return query(
    collection(db, paths.notificationsOf(uid)),
    orderBy("createdAt", "desc")
  );
}

/** Nudge the participant doc listener when we mark things read. */
export async function markNotificationRead(uid: string, notificationId: string) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, paths.notifications(uid, notificationId)), { read: true });
}

export async function markAllNotificationsRead(uid: string, ids: string[]) {
  if (ids.length === 0) return;
  const db = getFirestoreDb();
  const batch = writeBatch(db);
  for (const id of ids) {
    batch.update(doc(db, paths.notifications(uid, id)), { read: true });
  }
  await batch.commit();
}

export async function makeNotification(
  uid: string,
  data: Omit<NotificationDoc, "read" | "createdAt">
) {
  const db = getFirestoreDb();
  const batch = writeBatch(db);
  const ref = doc(db, paths.notifications(uid, makeId()));
  batch.set(ref, { ...data, read: false, createdAt: serverTimestamp() });
  await batch.commit();
}

function makeId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 20; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}