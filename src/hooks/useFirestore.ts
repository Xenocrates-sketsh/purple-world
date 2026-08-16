import { useEffect, useMemo, useState } from "react";
import type { DocumentData, Query } from "firebase/firestore";

import { getFirestoreDb } from "@/lib/firebase";
import { listenDoc, listenQuery } from "@/lib/db/helpers";
import type { Doc } from "@/lib/db/paths";

export interface QueryState<T> {
  docs: Doc<T>[] | null;
  loading: boolean;
  error: unknown;
}

/**
 * Subscribe to a query built from the given builder. `null` disables the
 * listener (e.g. while an id is still loading). Rebuilds when `deps` change.
 */
export function useQuery<T = DocumentData>(
  build: ((db: ReturnType<typeof getFirestoreDb>) => Query | null) | null,
  deps: unknown[] = []
): QueryState<T> {
  const [docs, setDocs] = useState<Doc<T>[] | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!build) {
      setDocs(null);
      return;
    }
    let disposed = false;
    let q: Query | null;
    try {
      q = build(getFirestoreDb());
    } catch (err) {
      setError(err);
      setDocs([]);
      return;
    }
    if (!q) {
      setDocs(null);
      return;
    }
    const unsub = listenQuery<T>(
      q,
      (next) => {
        if (!disposed) setDocs(next);
      },
      (err) => {
        if (!disposed) setError(err);
      }
    );
    return () => {
      disposed = true;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { docs, loading: docs === null, error };
}

export interface DocState<T> {
  doc: Doc<T> | null;
  loading: boolean;
  error: unknown;
}

/** Subscribe to a single document by full path. */
export function useDoc<T = DocumentData>(path: string | null): DocState<T> {
  const [doc, setDoc] = useState<Doc<T> | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!path) {
      setDoc(null);
      return;
    }
    let disposed = false;
    let unsub: (() => void) | undefined;
    try {
      unsub = listenDoc<T>(
        path,
        (next) => {
          if (!disposed) setDoc(next);
        },
        (err) => {
          if (!disposed) setError(err);
        }
      );
    } catch (err) {
      setError(err);
      setDoc(null);
      return;
    }
    return () => {
      disposed = true;
      unsub?.();
    };
  }, [path]);

  return { doc, loading: !path ? false : doc === null, error };
}

/** Memoize a list of Docs by id for O(1) lookups. */
export function useDocMap<T>(docs: Doc<T>[] | null): Map<string, T> {
  return useMemo(() => {
    const m = new Map<string, T>();
    docs?.forEach((d) => m.set(d.id, d.data));
    return m;
  }, [docs]);
}