"use client";

import * as React from "react";
import {
  getUser,
  handleAuthCallback,
  login as identityLogin,
  logout as identityLogout,
  signup as identitySignup,
  onAuthChange,
  type AuthError,
} from "@netlify/identity";
import { api } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
    joinCode?: string
  ) => Promise<{ emailVerified: boolean }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      const me = await api.get<AuthUser>("/api/auth/me");
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await handleAuthCallback();
      } catch {
        /* ignore callback errors */
      }
      if (cancelled) return;
      const idUser = await getUser();
      if (idUser) {
        await refresh();
      } else {
        setUser(null);
      }
      setLoading(false);
    })();

    const unsub = onAuthChange((event, currentUser) => {
      if (event === "logout") {
        setUser(null);
      } else if (currentUser) {
        refresh();
      }
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [refresh]);

  const login = React.useCallback(async (email: string, password: string) => {
    await identityLogin(email, password);
    await refresh();
  }, [refresh]);

  const register = React.useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      joinCode?: string
    ) => {
      const metadata: Record<string, unknown> = { full_name: fullName };
      if (joinCode) metadata.join_code = joinCode;
      const result = await identitySignup(email, password, metadata);
      const emailVerified = Boolean(result?.confirmedAt);
      if (emailVerified) await refresh();
      return { emailVerified };
    },
    [refresh]
  );

  const logout = React.useCallback(async () => {
    await identityLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function authErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const e = error as Error & { status?: number };
    if (e.status === 401) return "Incorrect email or password.";
    if (e.status === 403) return "Sign-ups are currently disabled.";
    if (e.status === 422) return "That email or password is not valid.";
    if (e.message.includes("already") || e.message.toLowerCase().includes("exists")) {
      return "An account with this email already exists.";
    }
    return e.message;
  }
  return "Something went wrong. Please try again.";
}
