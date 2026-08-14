import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { serverTimestamp, setDoc, updateDoc, doc } from "firebase/firestore";

import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";
import { humanError } from "@/lib/errors";
import { getInvite, setInviteUsed } from "@/lib/db/invites";
import { paths } from "@/lib/db/paths";
import { Brand } from "@/components/brand";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isValidEmail } from "@/lib/format";
import { useToast } from "@/lib/toast";

export function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [inviteCode, setInviteCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const code = inviteCode.trim().toUpperCase();
    if (!code) return setError("Enter the invite code Hafsa gave you.");
    if (displayName.trim().length < 2) return setError("Enter your full name.");
    if (!isValidEmail(email.trim())) return setError("That email address looks invalid.");
    if (password.length < 6) return setError("Your password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const db = getFirestoreDb();

      // 1. Validate the invite (public read only while unused & unexpired).
      const invite = await getInvite(code);
      if (!invite) return setError("This invite code isn't recognised.");
      if (invite.used) return setError("This invite code has already been used.");
      if (invite.expiresAt && invite.expiresAt.toMillis() < Date.now()) {
        return setError("This invite code has expired — ask Hafsa for a fresh one.");
      }
      if (invite.email && invite.email.toLowerCase() !== email.trim().toLowerCase()) {
        return setError("This invite is linked to a different email address.");
      }

      // 2. Create the Firebase Auth account.
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = credential.user.uid;
      await updateProfile(credential.user, { displayName: displayName.trim() });

      // 3. Link the pre-created student record to this account (one-time claim).
      await updateDoc(doc(db, paths.students(invite.studentId)), {
        linkedUid: uid,
      });

      // 4. Create the user profile doc (rules force role=student + studentId
      //    must point at a record the account has claimed).
      const studentRef = doc(db, paths.students(invite.studentId));
      const studentSnap = await (await import("firebase/firestore")).getDoc(studentRef);
      const studentData = studentSnap.exists() ? studentSnap.data() : null;

      await setDoc(doc(db, paths.users(uid)), {
        role: "student",
        email: email.trim().toLowerCase(),
        displayName: displayName.trim(),
        avatarUrl: null,
        studentId: invite.studentId,
        groupId: studentData?.groupId ?? null,
        createdAt: serverTimestamp(),
        prefs: { notifications: true, language: "eng" },
      });

      // 5. Consume the invite so it can't be reused.
      await setInviteUsed(code);

      toast("Welcome to Purple World! 🎓", { variant: "success" });
      navigate("/student", { replace: true });
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
          <h1 className="text-lg font-bold text-foreground">Create your student account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the invite code you received from Hafsa.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field
              label="Invite code"
              htmlFor="invite"
              hint="A 20-character code sent to you by your teacher."
            >
              <Input
                id="invite"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ABC2DE3FGH4JKL5MNPQ"
                autoCapitalize="characters"
                spellCheck={false}
                required
              />
            </Field>
            <Field label="Full name" htmlFor="name">
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                required
              />
            </Field>
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
            <Field label="Password" htmlFor="password" hint="Use your own password — never share it.">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                required
              />
            </Field>
            <Field label="Confirm password" htmlFor="confirm">
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </Field>

            {error ? (
              <p role="alert" className="text-sm font-medium text-danger">
                {error}
              </p>
            ) : null}

            <Button type="submit" loading={loading} className="w-full">
              Create account & enter my space
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}