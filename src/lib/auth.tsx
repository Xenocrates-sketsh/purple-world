import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  getIdTokenResult,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";

import { getFirebaseAuth, getFirestoreDb, initFirebase } from "./firebase";
import type { Role, UserDoc } from "./types";

type AuthStatus = "loading" | "ready" | "unconfigured";

interface AuthContextValue {
  status: AuthStatus;
  /** A success callback used to kick the token-refresh for role claims at login. */
  user: User | null;
  userDoc: UserDoc | null;
  role: Role | null;
  isTeacher: boolean;
  isStudent: boolean;
  refreshTokenClaims: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  const refreshTokenClaims = useCallback(async () => {
    if (!user) return;
    try {
      const result = await getIdTokenResult(user, true);
      const claim = result.claims.role;
      if (claim === "teacher" || claim === "student") {
        setRole(claim);
      }
    } catch {
      // token refresh can transiently fail offline; keep last known role
    }
  }, [user]);

  useEffect(() => {
    const configured = initFirebase();
    if (!configured) {
      setStatus("unconfigured");
      return;
    }

    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setUserDoc(null);
        setRole(null);
        setStatus("ready");
        return;
      }

      setUser(firebaseUser);
      setStatus("ready");

      // Role lives in custom claims (server-issued, cannot be spoofed).
      try {
        const result = await getIdTokenResult(firebaseUser, true);
        const claim = result.claims.role;
        if (claim === "teacher" || claim === "student") {
          setRole(claim);
        }
      } catch {
        // online refresh may fail briefly; userDoc below still carries a role
      }

      // Mirror the user profile doc so clients can read studentId/groupId/
      // displayName in real time.
      const unsubDoc = onSnapshot(
        doc(db, "users", firebaseUser.uid),
        (snap) => {
          if (snap.exists()) {
            setUserDoc(snap.data() as UserDoc);
            if (!role) {
              const r = snap.data().role as Role | undefined;
              if (r === "teacher" || r === "student") setRole(r);
            }
          } else {
            setUserDoc(null);
          }
        },
        () => {
          setUserDoc(null);
        }
      );

      (userUnsub.current as (() => void) | null)?.();
      userUnsub.current = unsubDoc;
    });

    return () => {
      unsubAuth();
      userUnsub.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep a ref so onAuthStateChanged can swap the user-doc listener safely
  const userUnsub = useRef<(() => void) | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      userDoc,
      role,
      isTeacher: role === "teacher",
      isStudent: role === "student",
      refreshTokenClaims,
    }),
    [status, user, userDoc, role, refreshTokenClaims]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

/**
 * Resolve the user's role right after a sign-in, before any navigation.
 * Checks the custom claim (forced refresh) first, then falls back to the
 * users/{uid} profile doc. Returns null only if the account truly has no role.
 */
export async function resolveRoleAfterLogin(): Promise<Role | null> {
  const auth = getFirebaseAuth();
  const current = auth.currentUser;
  if (!current) return null;

  try {
    const result = await getIdTokenResult(current, true);
    const claim = result.claims.role;
    if (claim === "teacher" || claim === "student") return claim;
  } catch {
    // force-refresh can fail transiently; fall through to the doc
  }

  try {
    const db = getFirestoreDb();
    const snap = await getDoc(doc(db, "users", current.uid));
    if (snap.exists()) {
      const r = (snap.data() as { role?: unknown }).role;
      if (r === "teacher" || r === "student") return r;
    }
  } catch {
    // unreadable doc (offline/permissions) — caller decides what to show
  }

  return null;
}
