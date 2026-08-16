import {
  addDoc,
  collection,
  collectionGroup,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase";
import type { ConversationDoc, ParticipantDoc } from "@/lib/types";
import { paths } from "./paths";
import { getOne } from "./helpers";

/** Teacher's conversations (array-contains self; needs composite index). */
export function teacherConversationsQuery(db: Firestore, teacherUid: string) {
  return query(
    collection(db, "conversations"),
    where("participantIds", "array-contains", teacherUid),
    orderBy("lastMessageAt", "desc")
  );
}

/** The student's conversation (single expected doc). */
export function studentConversationQuery(db: Firestore, studentUid: string) {
  return query(
    collection(db, "conversations"),
    where("participantIds", "array-contains", studentUid),
    limit(1)
  );
}

export async function findConversation(participantIds: string[]) {
  const db = getFirestoreDb();
  const snap = await getDocs(
    query(
      collection(db, "conversations"),
      where("participantIds", "array-contains", participantIds[0]),
      limit(10)
    )
  );
  const found = snap.docs.find((d) => {
    const data = d.data() as Partial<ConversationDoc>;
    return (
      Array.isArray(data.participantIds) &&
      participantIds.every((id) => data.participantIds!.includes(id))
    );
  });
  return found ? ({ id: found.id, data: found.data() as ConversationDoc } as const) : null;
}

export async function getConversation(conversationId: string) {
  return getOne<ConversationDoc>(paths.conversations(conversationId));
}

export async function createConversation(
  studentUid: string,
  teacherUid: string,
  studentId: string | null
): Promise<string> {
  const db = getFirestoreDb();
  const ref = await addDoc(collection(db, "conversations"), {
    participantIds: [studentUid, teacherUid],
    studentId,
    teacherId: teacherUid,
    createdAt: serverTimestamp(),
    lastMessageAt: null,
    lastMessagePreview: null,
    lastMessageSenderId: null,
  });
  // Seed both participants' lastReadAt markers.
  for (const uid of [studentUid, teacherUid]) {
    await setDoc(doc(db, paths.participants(ref.id, uid)), {
      uid,
      conversationId: ref.id,
      lastReadAt: serverTimestamp(),
    });
  }
  return ref.id;
}

export function messagesOfConversationQuery(db: Firestore, conversationId: string) {
  return query(
    collection(db, paths.messagesOf(conversationId)),
    orderBy("createdAt", "asc")
  );
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string
) {
  const db = getFirestoreDb();
  await addDoc(collection(db, paths.messagesOf(conversationId)), {
    senderId,
    text,
    createdAt: serverTimestamp(),
    readBy: [senderId],
  });
  await updateDoc(doc(db, paths.conversations(conversationId)), {
    lastMessageAt: serverTimestamp(),
    lastMessagePreview: text.slice(0, 120),
    lastMessageSenderId: senderId,
  });
}

export async function markConversationRead(conversationId: string, uid: string) {
  const db = getFirestoreDb();
  await setDoc(
    doc(db, paths.participants(conversationId, uid)),
    { uid, conversationId, lastReadAt: serverTimestamp() },
    { merge: true }
  );
}

export async function getParticipantReadAt(
  conversationId: string,
  uid: string
): Promise<Date | null> {
  const p = await getOne<ParticipantDoc>(paths.participants(conversationId, uid));
  return p?.data.lastReadAt?.toDate() ?? null;
}

/** All of a user's participant markers across conversations (single listener). */
export function myParticipantDocsQuery(db: Firestore, uid: string) {
  return query(
    collectionGroup(db, "participants"),
    where("uid", "==", uid)
  );
}