import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

import { resolveRoleAfterLogin, useAuth } from "@/lib/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { humanError } from "@/lib/errors";
import { Brand } from "@/components/brand";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TeacherLoginPage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Already signed in as the teacher — go straight home.
  if (user && role === "teacher") {
    return <Navigate to="/teacher" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your teacher email and password.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      const resolved = await resolveRoleAfterLogin();

      if (resolved === "teacher") {
        navigate("/teacher", { replace: true });
        return;
      }

      // Not a teacher account — do not wander into the teacher area.
      if (resolved === "student") {
        await signOut(getFirebaseAuth());
        setError(
          "This account belongs to a student. Use the student sign-in instead."
        );
        return;
      }

      await signOut(getFirebaseAuth());
      setError(
        "We couldn't verify a teacher role on this account. Ask Hafsa to set up your teacher access, then try again."
      );
    } catch (err) {
      setError(humanError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex justify-center" aria-label="Back to welcome">
          <Brand />
        </Link>
        <div className="card p-6">
          <h1 className="text-lg font-bold text-foreground">Teacher sign-in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back, Hafsa. This is the teacher entrance — students use the
            student sign-in.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Password" htmlFor="password">
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>

            {error ? (
              <p role="alert" className="text-sm font-medium text-danger">
                {error}
              </p>
            ) : null}

            <Button type="submit" loading={loading} className="w-full">
              Sign in as teacher
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="font-medium text-primary hover:underline">
              Forgot password?
            </Link>
            <Link to="/login" className="font-medium text-primary hover:underline">
              Student sign-in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}