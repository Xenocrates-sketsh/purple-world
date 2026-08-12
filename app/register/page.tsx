"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2, KeyRound } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, authErrorMessage } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [joinCode, setJoinCode] = React.useState("");
  const [groupName, setGroupName] = React.useState<string | null>(null);
  const [codeValid, setCodeValid] = React.useState<null | boolean>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) setJoinCode(code);
  }, []);

  const verifyCode = async (raw: string) => {
    const code = raw.trim().toUpperCase();
    if (code.length < 3) {
      setGroupName(null);
      setCodeValid(null);
      return;
    }
    setVerifying(true);
    try {
      const group = await api.get<{ name: string; color: string }>(
        `/api/auth/validate-code?code=${encodeURIComponent(code)}`
      );
      setGroupName(group.name);
      setCodeValid(true);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setGroupName(null);
        setCodeValid(false);
      } else {
        setCodeValid(null);
      }
    } finally {
      setVerifying(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await register(
        email.trim(),
        password,
        fullName.trim(),
        joinCode.trim().toUpperCase()
      );
      router.push("/student");
      router.refresh();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell footer="Purple World · BAC English support">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="card-surface p-6 sm:p-8"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Join Purple World
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the group code Hafsa gave you to join your class.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-soft p-3 text-sm text-danger"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="joinCode">Group code</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                id="joinCode"
                required
                placeholder="e.g. PW-7K2LM"
                className="pl-9 uppercase tracking-widest"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value);
                  verifyCode(e.target.value);
                }}
              />
            </div>
            <div className="mt-1.5 min-h-[20px] text-sm">
              {verifying && (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Checking code…
                </span>
              )}
              {codeValid && groupName && (
                <span className="inline-flex items-center gap-1.5 text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  Joining group “{groupName}”
                </span>
              )}
              {codeValid === false && (
                <span className="text-danger">That code isn&apos;t valid. Ask Hafsa for the right one.</span>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              required
              autoComplete="name"
              placeholder="e.g. Amina Benali"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="6+ characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            {loading ? "Creating your account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login?next=/student&role=student" className="font-medium text-primary hover:text-primary/80">
            Sign in
          </Link>
        </p>
      </motion.div>
    </AuthShell>
  );
}
