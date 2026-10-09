import { useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut, linkWithCredential, EmailAuthProvider, createUserWithEmailAndPassword } from "firebase/auth";

import { resolveRoleAfterLogin, useAuth } from "@/lib/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { humanError } from "@/lib/errors";
import { isValidEmail, normalizeDZPhone, looksLikePhone } from "@/lib/format";
import loginBg from "@/assets/login-bg.webp";
import { useQuery } from "@/hooks/useFirestore";
import { myArrivalQuery, createArrival } from "@/lib/db/arrivals";
import type { ArrivalDoc } from "@/lib/types";
import { Brand } from "@/components/brand";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

type Mode = "request" | "signin";

export function LoginPage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("request");

  // multi-step request flow: 1 = name+email, 2 = school+number, 3 = age
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  function goStep(next: number) {
    setDirection(next > step ? "forward" : "back");
    setStep(next);
    setError(null);
  }

  function nextFromStep1() {
    if (!name.trim() || !email.trim()) {
      setError("Enter your full name and email.");
      return;
    }
    if (!isValidEmail(email.trim().toLowerCase())) {
      setError("That email address doesn't look right.");
      return;
    }
    if (reqPassword.length < 6) {
      setError("Choose a password of at least 6 characters — it stays yours if you're accepted.");
      return;
    }
    if (reqPassword !== reqPassword2) {
      setError("Passwords don't match.");
      return;
    }
    goStep(2);
  }

  // request form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reqPassword, setReqPassword] = useState("");
  const [reqPassword2, setReqPassword2] = useState("");
  const [school, setSchool] = useState("");
  const [number, setNumber] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);

  // legacy sign-in form
  const [signinEmail, setSigninEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signinError, setSigninError] = useState<string | null>(null);
  const [signinLoading, setSigninLoading] = useState(false);

  // one-time password setup right after approval (still signed in
  // anonymously, so linking works immediately — no trip to Settings)
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  // The student's own arrival request(s) — shown as live status.
  const myArrivals = useQuery<ArrivalDoc>(
    user ? (db) => myArrivalQuery(db, user.uid) : null,
    [user?.uid]
  );

  const latest = useMemo(() => {
    const list = myArrivals.docs ?? [];
    if (list.length === 0) return null;
    return [...list].sort((a, b) => {
      const ta = a.data.createdAt?.toMillis?.() ?? 0;
      const tb = b.data.createdAt?.toMillis?.() ?? 0;
      return tb - ta;
    })[0];
  }, [myArrivals.docs]);

  // Already signed in with a role — go to the right space.
  if (user && role) {
    return <Navigate to={role === "teacher" ? "/teacher" : "/student"} replace />;
  }

  async function submitRequest(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName || !trimmedEmail) {
      setError("Enter your full name and email.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError("That email address doesn't look right.");
      return;
    }
    const ageNum = age ? Math.round(Number(age)) : null;
    if (ageNum == null || ageNum < 17 || ageNum > 25) {
      setError("Please tell us your age — between 17 and 25.");
      goStep(3);
      return;
    }
    // "Number" accepts a phone or a student no. — validate only phone input
    // against the Algerian mobile schema (+213 + 5/6/7 + 8 digits).
    const trimmedNumber = number.trim();
    let phone: string | null = null;
    if (trimmedNumber) {
      if (looksLikePhone(trimmedNumber)) {
        phone = normalizeDZPhone(trimmedNumber);
        if (!phone) {
          setError("Number is wrong.");
          return;
        }
      } else {
        phone = trimmedNumber;
      }
    }
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const current = auth.currentUser;
      // The student owns this password from the start: create the real
      // email/password account right away. It unlocks nothing until the
      // teacher approves (no role = no access), and stays valid after.
      let uid = current?.uid ?? null;
      if (current && !current.isAnonymous && current.email === trimmedEmail) {
        uid = current.uid;
      } else {
        if (current) await signOut(auth);
        const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, reqPassword);
        uid = cred.user.uid;
      }
      await createArrival({
        name: trimmedName,
        email: trimmedEmail,
        school: school.trim() || null,
        number: phone,
        age: ageNum,
        uid,
      });
      goStep(1);
      setPendingOpen(true);
    } catch (err) {
      setError(humanError(err));
    } finally {
      setLoading(false);
    }
  }

  async function submitSignin(e: FormEvent) {
    e.preventDefault();
    setSigninError(null);
    if (!signinEmail.trim() || !password) {
      setSigninError("Enter your email and password.");
      return;
    }
    setSigninLoading(true);
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), signinEmail.trim(), password);
      const resolved = await resolveRoleAfterLogin();
      if (resolved === "student") {
        navigate("/student", { replace: true });
        return;
      }
      await signOut(getFirebaseAuth());
      setSigninError(
        resolved === "teacher"
          ? "This is the teacher account — please use the teacher sign-in."
          : "Your teacher hasn't activated your account yet. Please be patient — you'll get in once approved."
      );
    } catch (err) {
      setSigninError(humanError(err));
    } finally {
      setSigninLoading(false);
    }
  }

  const showRequestForm = !latest || latest.data.status === "rejected";
  const hasPassword =
    user?.providerData.some((p) => p.providerId === "password") ?? false;

  async function submitPassword(e: FormEvent) {
    e.preventDefault();
    setPwError(null);
    if (!user || !latest) return;
    if (newPw.length < 6) {
      setPwError("Password must be at least 6 characters.");
      return;
    }
    if (newPw !== newPw2) {
      setPwError("Passwords don't match.");
      return;
    }
    setPwLoading(true);
    try {
      await linkWithCredential(user, EmailAuthProvider.credential(latest.data.email, newPw));
      navigate("/student", { replace: true });
    } catch (err) {
      setPwError(humanError(err));
    } finally {
      setPwLoading(false);
    }
  }

  const statusPanel =
    latest?.data.status === "accepted" ? (
      <div className="flex items-start gap-3 rounded-xl bg-success-soft p-4 text-success">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="w-full">
          <p className="text-sm font-semibold">Request approved</p>
          {hasPassword ? (
            <p className="mt-0.5 text-sm">
              Your account is ready — opening your space…
            </p>
          ) : (
            <form onSubmit={submitPassword} className="mt-3 space-y-3">
              <p className="text-sm text-foreground">
                One last step — choose a password so you can sign back in
                anytime with <span className="font-semibold">{latest.data.email}</span>.
              </p>
              <Field label="Choose a password" htmlFor="first-password" required>
                <Input
                  id="first-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                />
              </Field>
              <Field label="Confirm password" htmlFor="first-password2" required>
                <Input
                  id="first-password2"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat it"
                  value={newPw2}
                  onChange={(e) => setNewPw2(e.target.value)}
                  required
                />
              </Field>
              {pwError ? (
                <p role="alert" className="text-sm font-medium text-danger">
                  {pwError}
                </p>
              ) : null}
              <Button type="submit" loading={pwLoading} className="w-full">
                Set password & enter
              </Button>
            </form>
          )}
        </div>
      </div>
    ) : latest?.data.status === "rejected" ? (
      <div className="flex items-start gap-3 rounded-xl bg-danger-soft p-4 text-danger">
        <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="text-sm font-semibold">Request declined</p>
          <p className="mt-0.5 text-sm">
            Your request wasn't approved. Please contact your teacher, or submit a new request.
          </p>
        </div>
      </div>
    ) : latest?.data.status === "pending" ? (
      <div className="flex items-start gap-3 rounded-xl bg-warning-soft p-4 text-warning">
        <Clock className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="text-sm font-semibold">Request received</p>
          <p className="mt-0.5 text-sm">
            Your teacher will review it soon. You'll be taken to your space once approved.
          </p>
        </div>
      </div>
    ) : null;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
      <div aria-hidden className="absolute inset-0">
        <img
          src={loginBg}
          alt=""
          draggable={false}
          className="h-full w-full scale-105 object-cover blur-md"
        />
        <div className="absolute inset-0 bg-background/75" />
      </div>
      <div className="relative w-full max-w-xs sm:max-w-sm">
        <Link to="/" className="mb-8 flex justify-center" aria-label="Back to welcome">
          <Brand />
        </Link>
        <div className="card p-5 sm:p-6">
          <h1 className="text-lg font-bold text-foreground">
            {mode === "request" ? "Join Purple World" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "request"
              ? "Choose your password now — it stays yours once your teacher approves you."
              : "Student sign-in. Teachers use the teacher sign-in."}
          </p>

          {statusPanel ? (
            <div className="mt-6">{statusPanel}</div>
          ) : null}

          {mode === "request" && showRequestForm ? (
            <div className="mt-6">
              <div className="mb-4 flex items-center justify-center gap-1.5" aria-hidden>
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={
                      "h-1.5 rounded-full transition-all " +
                      (i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/60" : "w-1.5 bg-border")
                    }
                  />
                ))}
              </div>
              <form onSubmit={submitRequest} className="space-y-4">
                <div
                  key={step}
                  className={direction === "forward" ? "animate-slide-in-right space-y-4" : "animate-slide-in-left space-y-4"}
                >
                  {step === 1 ? (
                    <>
                      <Field label="Full name" htmlFor="req-name" required>
                        <Input
                          id="req-name"
                          autoComplete="name"
                          placeholder="Ahmed Benali"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </Field>
                      <Field label="Email" htmlFor="req-email" required>
                        <Input
                          id="req-email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Password" htmlFor="req-password" required hint="Yours to keep if accepted">
                          <Input
                            id="req-password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="At least 6 characters"
                            value={reqPassword}
                            onChange={(e) => setReqPassword(e.target.value)}
                            required
                          />
                        </Field>
                        <Field label="Confirm" htmlFor="req-password2" required>
                          <Input
                            id="req-password2"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Repeat it"
                            value={reqPassword2}
                            onChange={(e) => setReqPassword2(e.target.value)}
                            required
                          />
                        </Field>
                      </div>
                    </>
                  ) : null}
                  {step === 2 ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="School" htmlFor="req-school">
                          <Input
                            id="req-school"
                            placeholder="Lycee…"
                            value={school}
                            onChange={(e) => setSchool(e.target.value)}
                          />
                        </Field>
                        <Field label="Number" htmlFor="req-number">
                          <Input
                            id="req-number"
                            placeholder="Phone or student no."
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                          />
                        </Field>
                      </div>
                    </>
                  ) : null}
                  {step === 3 ? (
                    <Field label="How old are you?" htmlFor="req-age" required hint="Just so your teacher knows your class level.">
                      <Input
                        id="req-age"
                        type="number"
                        min={17}
                        max={25}
                        placeholder="17 – 25"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        required
                      />
                    </Field>
                  ) : null}
                </div>

                {error ? (
                  <p role="alert" className="text-sm font-medium text-danger">
                    {error}
                  </p>
                ) : null}

                <div className="flex gap-2">
                  {step > 1 ? (
                    <Button type="button" variant="secondary" onClick={() => goStep(step - 1)} className="flex-1">
                      Back
                    </Button>
                  ) : null}
                  {step < 3 ? (
                    <Button
                      type="button"
                      onClick={() => (step === 1 ? nextFromStep1() : goStep(3))}
                      className="flex-1"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button type="submit" loading={loading} className="flex-1">
                      {latest?.data.status === "rejected" ? "Submit a new request" : "Request to join"}
                    </Button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            <form onSubmit={submitSignin} className="mt-6 space-y-4">
              <Field label="Email" htmlFor="signin-email">
                <Input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={signinEmail}
                  onChange={(e) => setSigninEmail(e.target.value)}
                  required
                />
              </Field>
              <Field label="Password" htmlFor="signin-password">
                <Input
                  id="signin-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>

              {signinError ? (
                <p role="alert" className="text-sm font-medium text-danger">
                  {signinError}
                </p>
              ) : null}

              <Button type="submit" loading={signinLoading} className="w-full">
                Sign in
              </Button>
            </form>
          )}

          <div className="mt-4 flex flex-col gap-2 text-sm">
            <button
              type="button"
              onClick={() => setMode(mode === "request" ? "signin" : "request")}
              className="font-medium text-primary hover:underline"
            >
              {mode === "request" ? "Already a student? Sign in" : "New student? Request access"}
            </button>
            <Link to="/forgot-password" className="font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          <p className="mt-4 border-t pt-4 text-center text-sm text-muted-foreground">
            Are you the teacher?{" "}
            <Link to="/login/teacher" className="font-medium text-primary hover:underline">
              Use the teacher sign-in
            </Link>
          </p>
        </div>

        <Modal
          open={pendingOpen}
          onClose={() => setPendingOpen(false)}
          title="Request received"
          footer={
            <Button onClick={() => setPendingOpen(false)} className="w-full">
              Understood
            </Button>
          }
        >
          <p className="text-sm text-muted-foreground">
            Your request is pending. Your account will likely be approved by
            your teacher within the next 24–48 hours. Come back then and sign
            in with your email and password.
          </p>
        </Modal>
      </div>
    </div>
  );
}