import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
  where,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase";
import type { AnnouncementDoc, NotificationType } from "@/lib/types";
import { paths } from "./paths";

export function allAnnouncementsQuery(db: Firestore) {
  return query(collection(db, "announcements"), orderBy("createdAt", "desc"));
}

/**
 * Student-scoped announcements. `recipientKeys` holds "all", "group:{id}" and
 * "student:{id}" — array-contains-any performs the server-side filter.
 * Needs composite index: `announcements.recipientKeys ASC, createdAt DESC`.
 */
export function studentAnnouncementsQuery(db: Firestore, recipientKeys: string[]) {
  return query(
    collection(db, "announcements"),
    where("recipientKeys", "array-contains-any", recipientKeys),
    orderBy("createdAt", "desc")
  );
}

export async function createAnnouncement(data: Omit<AnnouncementDoc, "createdAt">) {
  const db = getFirestoreDb();
  const ref = await addDoc(collection(db, "announcements"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteAnnouncement(announcementId: string) {
  const db = getFirestoreDb();
  await deleteDoc(doc(db, paths.announcements(announcementId)));
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
}

/**
 * Fan out in-app notifications to a set of user uids (Spark-plan compatible —
 * no Cloud Function; the initiating client writes, rules gate every doc).
 * Each notification lives at notifications/{uid}/items/{autoId}.
 */
export async function fanOutNotifications(
  uids: string[],
  payload: NotificationPayload
) {
  if (uids.length === 0) return;
  const db = getFirestoreDb();
  const batch = writeBatch(db);
  for (const uid of uids) {
    const ref = doc(db, paths.notifications(uid, makeNotificationId()));
    batch.set(ref, {
      ...payload,
      read: false,
      createdAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

function makeNotificationId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 20; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}