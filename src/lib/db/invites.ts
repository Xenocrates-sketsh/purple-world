import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase";
import type { InviteDoc } from "@/lib/types";
import { paths } from "./paths";

/**
 * Invite-code flow (the chosen onboarding path).
 *
 * Security model:
 * - Codes are high-entropy (INVITE_CODE_LENGTH random chars) so enumeration is
 *   infeasible. Rules allow a *public* read ONLY while `used == false`.
 * - The signup client consumes the invite by flipping `used: true` in the same
 *   rules-gated update that links the student doc (see firestore.rules).
 */
export async function getInvite(code: string): Promise<InviteDoc | null> {
  const db = getFirestoreDb();
  const snap = await getDoc(doc(db, paths.invites(code)));
  return snap.exists() ? (snap.data() as InviteDoc) : null;
}

export async function createInvite(code: string, data: Omit<InviteDoc, "used" | "createdAt">) {
  const db = getFirestoreDb();
  await setDoc(doc(db, paths.invites(code)), {
    ...data,
    used: false,
    createdAt: serverTimestamp(),
  });
}

export async function setInviteUsed(code: string) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, paths.invites(code)), { used: true });
}

export async function createInviteForStudent(
  code: string,
  studentId: string,
  email: string | null,
  expiresAt: Date
) {
  const db = getFirestoreDb();
  await setDoc(doc(db, paths.invites(code)), {
    studentId,
    email,
    used: false,
    expiresAt,
    createdAt: serverTimestamp(),
  });
}

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const arr = new Uint8Array(20);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
    for (const b of arr) out += chars[b % chars.length];
  } else {
    for (let i = 0; i < 20; i++) out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}