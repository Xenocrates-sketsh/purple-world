import { useState, type FormEvent } from "react";
import { EmailAuthProvider, linkWithCredential } from "firebase/auth";

import { useAuth } from "@/lib/auth";
import { humanError } from "@/lib/errors";
import { isValidEmail } from "@/lib/format";
import { useToast } from "@/lib/toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";

/**
 * Lets a student attach an email + password to their account.
 * Students join via passwordless (anonymous) auth, so without this they
 * could never use the email/password sign-in form.
 */
export function SecurityCard() {
  const { user, userDoc } = useAuth();
  const { toast } = useToast();

  const hasPassword =
    user?.providerData.some((p) => p.providerId === "password") ?? false;

  const [email, setEmail] = useState(userDoc?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!user) return;
    if (!isValidEmail(trimmedEmail)) {
      toast("That email address doesn't look right.", { variant: "error" });
      return;
    }
    if (password.length < 6) {
      toast("Password must be at least 6 characters.", { variant: "error" });
      return;
    }
    if (password !== confirm) {
      toast("Passwords don't match.", { variant: "error" });
      return;
    }
    setSaving(true);
    try {
      await linkWithCredential(user, EmailAuthProvider.credential(trimmedEmail, password));
      toast("Password set — you can now sign in with email + password.", { variant: "success" });
      setPassword("");
      setConfirm("");
    } catch (err) {
      toast(humanError(err), { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Sign-in & password"
        description="Use this to sign back in on any device."
      />
      <CardContent>
        {hasPassword ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Password sign-in is on for {user?.email ?? "your account"}.
            </p>
            <Badge variant="success">Active</Badge>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You joined without a password. Set one below so you can sign in
              with your email on any device.
            </p>
            <Field label="Email" htmlFor="sec-email" required>
              <Input
                id="sec-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="New password" htmlFor="sec-password" required hint="At least 6 characters">
                <Input
                  id="sec-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              <Field label="Confirm password" htmlFor="sec-confirm" required>
                <Input
                  id="sec-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </Field>
            </div>
            <Button type="submit" loading={saving}>
              Set password
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
