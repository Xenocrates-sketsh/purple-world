import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";

import { getFirebaseAuth } from "@/lib/firebase";
import { humanError } from "@/lib/errors";
import { isValidEmail } from "@/lib/format";
import { Brand } from "@/components/brand";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email.trim())) return setError("Enter a valid email address.");
    setLoading(true);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
      setSent(true);
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
          <h1 className="text-lg font-bold text-foreground">Reset your password</h1>
          {sent ? (
            <div className="mt-4 rounded-xl bg-success-soft p-4 text-sm text-success">
              If an account exists for that email, a reset link is on its way. Check your inbox.
            </div>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your email and we’ll send you a secure reset link.
              </p>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <Field label="Email" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </Field>
                {error ? (
                  <p role="alert" className="text-sm font-medium text-danger">
                    {error}
                  </p>
                ) : null}
                <Button type="submit" loading={loading} className="w-full">
                  Send reset link
                </Button>
              </form>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Remembered it?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}