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
  linkWithCredential,
  EmailAuthProvider,
  fetchSignInMethodsForEmail,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
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
            const data = snap.data() as UserDoc;
            setUserDoc(data);
            if (!role) {
              const r = data.role as Role | undefined;
              if (r === "teacher" || r === "student") setRole(r);
            }
            // Self-heal: keep users/{uid}.groupId in sync with the linked
            // students/{studentId}.groupId. The group-scoped Firestore rules
            // AND every group filter in the app read groupId from the users
            // doc, so a stale/missing value silently hides lessons, schedule
            // and group content. Only writes when different (no loop).
            if (data.studentId) {
              void (async () => {
                try {
                  const sSnap = await getDoc(doc(db, "students", data.studentId as string));
                  if (!sSnap.exists()) return;
                  const sGroup = (sSnap.data() as { groupId?: unknown }).groupId ?? null;
                  const uGroup = (data.groupId as unknown) ?? null;
                  if (sGroup !== uGroup) {
                    await updateDoc(doc(db, "users", firebaseUser.uid), {
                      groupId: sGroup,
                    });
                  }
                } catch {
                  // offline / permissions — leave it; next snapshot retries
                }
              })();
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

/**
 * Attach an email/password credential to the currently signed-in user.
 * Students who signed up via magic link have no password yet; linking one lets
 * them sign in with email + password afterwards (no new email link needed).
 */
export async function linkPasswordToCurrentUser(password: string): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user?.email) throw new Error("No signed-in account to attach a password to.");
  await linkWithCredential(user, EmailAuthProvider.credential(user.email, password));
}

/**
 * The sign-in methods an email supports, e.g. ["emailLink"] or
 * ["emailLink", "password"]. Falls back to [] on transient errors so callers
 * can decide their own UX.
 */
export async function signInMethodsForEmail(email: string): Promise<string[]> {
  const auth = getFirebaseAuth();
  try {
    return await fetchSignInMethodsForEmail(auth, email);
  } catch {
    return [];
  }
}
