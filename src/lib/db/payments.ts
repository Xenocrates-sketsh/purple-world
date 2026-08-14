import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase";
import type { PaymentDoc } from "@/lib/types";
import { paths } from "./paths";

export function allPaymentsQuery(db: Firestore) {
  return query(collection(db, "payments"), orderBy("dueDate", "desc"));
}

export function studentPaymentsQuery(db: Firestore, studentId: string) {
  return query(
    collection(db, "payments"),
    where("studentId", "==", studentId),
    orderBy("dueDate", "desc")
  );
}

export async function createPayment(data: Omit<PaymentDoc, "createdAt">) {
  const db = getFirestoreDb();
  const ref = await addDoc(collection(db, "payments"), data);
  return ref.id;
}

export async function updatePayment(paymentId: string, patch: Partial<PaymentDoc>) {
  const db = getFirestoreDb();
  await updateDoc(doc(db, paths.payments(paymentId)), patch);
}

export async function deletePayment(paymentId: string) {
  const db = getFirestoreDb();
  await deleteDoc(doc(db, paths.payments(paymentId)));
}

export async function markPaymentPaid(
  paymentId: string,
  paidDate: Date,
  amount?: number
) {
  const db = getFirestoreDb();
  const patch: Partial<PaymentDoc> = {
    status: "paid",
    paidDate: Timestamp.fromDate(paidDate),
  };
  if (amount != null) patch.amount = amount;
  await updateDoc(doc(db, paths.payments(paymentId)), patch);
}