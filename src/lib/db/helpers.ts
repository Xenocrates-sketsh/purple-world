import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
  type Query,
  type Unsubscribe,
} from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase";
import type { Doc } from "./paths";

/**
 * Subscribe to a query, mapping snapshots to Doc<T>[].
 * `onFirst` is invoked after the first snapshot so pages can swap skeletons
 * for content cleanly; `onError` handles permission/network failures.
 */
export function listenQuery<T>(
  q: Query,
  onData: (docs: Doc<T>[]) => void,
  onError?: (err: unknown) => void,
  onFirst?: () => void
): Unsubscribe {
  let first = true;
  return onSnapshot(
    q,
    (snap) => {
      const docs = snap.docs.map(
        (d) => ({ id: d.id, data: d.data() as T, ref: d.ref }) as Doc<T>
      );
      onData(docs);
      if (first) {
        first = false;
        onFirst?.();
      }
    },
    (err) => {
      onError?.(err);
      onFirst?.();
    }
  );
}

/** Subscribe a single document. */
export function listenDoc<T>(
  path: string,
  onData: (doc: Doc<T> | null) => void,
  onError?: (err: unknown) => void,
  onFirst?: () => void
): Unsubscribe {
  const db = getFirestoreDb();
  let first = true;
  return onSnapshot(
    doc(db, path),
    (snap) => {
      onData(
        snap.exists()
          ? ({ id: snap.id, data: snap.data() as T, ref: snap.ref } as Doc<T>)
          : null
      );
      if (first) {
        first = false;
        onFirst?.();
      }
    },
    (err) => {
      onError?.(err);
      onFirst?.();
    }
  );
}

export async function getOne<T>(path: string): Promise<Doc<T> | null> {
  const db = getFirestoreDb();
  const snap = await getDoc(doc(db, path));
  if (!snap.exists()) return null;
  return { id: snap.id, data: snap.data() as T };
}

export function refOf(path: string) {
  return doc(getFirestoreDb(), path);
}

export function collectionOf(path: string) {
  return collection(getFirestoreDb(), path);
}

export function collectionGroupOf(name: string) {
  return collectionGroup(getFirestoreDb(), name);
}

export { collection, doc, getDoc, onSnapshot, orderBy, query, where };
export type { Unsubscribe };