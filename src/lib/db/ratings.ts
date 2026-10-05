import {
  addDoc,
  collection,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase";
import { paths } from "./paths";

/** Newest ratings first (capped — plenty for an average + count). */
export function ratingsQuery(db: Firestore, max = 500) {
  return query(
    collection(db, paths.ratings),
    orderBy("createdAt", "desc"),
    limit(max)
  );
}

export async function submitRating(score: number) {
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new Error("Score must be a whole number from 1 to 5.");
  }
  const db = getFirestoreDb();
  await addDoc(collection(db, paths.ratings), {
    score,
    createdAt: serverTimestamp(),
  });
}

export function ratingStats(scores: number[]): { count: number; average: number } {
  const count = scores.length;
  if (count === 0) return { count: 0, average: 0 };
  const sum = scores.reduce((s, v) => s + v, 0);
  return { count, average: Math.round((sum / count) * 10) / 10 };
}
