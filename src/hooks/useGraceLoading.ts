import { useEffect, useState } from "react";

/**
 * Time-boxed loading flag: true while `loading` for at most `ms`.
 * After the grace period the caller falls through to its empty state
 * ("No lessons yet", …) instead of shimmering forever on slow/offline links.
 */
export function useGraceLoading(loading: boolean, ms = 3000): boolean {
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    if (!loading) {
      setExpired(false);
      return;
    }
    const t = setTimeout(() => setExpired(true), ms);
    return () => clearTimeout(t);
  }, [loading, ms]);
  return loading && !expired;
}
