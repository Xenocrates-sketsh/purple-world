import { useEffect, useMemo } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { GraduationCap, UserRound, ArrowRight, Quote } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { Brand } from "@/components/brand";
import { Card } from "@/components/ui/card";

const QUOTES = [
  {
    text: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King",
  },
  {
    text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
    author: "Malcolm X",
  },
  {
    text: "It is our choices that show what we truly are, far more than our abilities.",
    author: "J.K. Rowling",
  },
  {
    text: "The man who does not read has no advantage over the man who cannot read.",
    author: "Mark Twain",
  },
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle",
  },
  {
    text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.",
    author: "Ralph Waldo Emerson",
  },
  {
    text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.",
    author: "George R.R. Martin",
  },
];

function todayQuote() {
  const start = new Date(new Date().getFullYear(), 0, 0).getTime();
  const day = Math.floor((Date.now() - start) / 86400000);
  return QUOTES[day % QUOTES.length];
}

export function WelcomePage() {
  const { status, user, role, isTeacher, isStudent } = useAuth();
  const navigate = useNavigate();
  const quote = useMemo(todayQuote, []);

  useEffect(() => {
    if (status === "unconfigured") return;
    if (!user || !role) return;
    if (status === "loading") return;
    navigate(isTeacher || role === "teacher" ? "/teacher" : "/student", { replace: true });
  }, [status, user, role, isTeacher, isStudent, navigate]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (user && role) {
    return <Navigate to={role === "teacher" ? "/teacher" : "/student"} replace />;
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
      {/* ambient purple mesh */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="pw-ambient absolute -top-1/4 left-1/2 h-[120vh] w-[120vh] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.22),transparent_70%)]" />
        <div
          className="pw-ambient absolute -bottom-1/3 right-1/4 h-[80vh] w-[80vh] rounded-full bg-[radial-gradient(closest-side,hsl(var(--accent)/0.18),transparent_70%)]"
          style={{ animationDelay: "-7s" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,hsl(var(--background))_85%)]" />
      </div>

      <div className="relative w-full max-w-xl">
        <div className="pw-rise flex flex-col items-center gap-2 text-center">
          <Brand className="text-2xl" />
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            English · BAC 2026
          </p>
        </div>

        <h1 className="pw-rise pw-rise-2 mt-6 text-center text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
          Your space for{" "}
          <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
            BAC English
          </span>
          .
        </h1>
        <p className="pw-rise pw-rise-3 mt-2 text-center text-sm leading-relaxed text-muted-foreground">
          Lessons, exercises, grades and chat with Hafsa — everything for your English exam, in one
          purple place.
        </p>

        {/* signature: quote of the day */}
        <figure className="pw-rise pw-rise-3 mx-auto mt-7 max-w-lg rounded-2xl border border-border bg-surface-elevated/70 p-5 shadow-sm backdrop-blur">
          <Quote className="h-4 w-4 text-primary" aria-hidden />
          <blockquote className="mt-2 font-['Fraunces','Lora',Georgia,serif] text-base italic leading-relaxed text-foreground">
            “{quote.text}”
          </blockquote>
          <figcaption className="mt-2 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
            — {quote.author}
          </figcaption>
        </figure>

        <div className="pw-rise pw-rise-4 mt-7 grid gap-3 sm:grid-cols-2">
          <Link to="/login" className="block" tabIndex={-1} aria-label="Continue as student">
            <Card className="group card-hover h-full p-5 transition-transform hover:-translate-y-0.5">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  <GraduationCap className="h-6 w-6" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-base font-semibold text-foreground">
                    I’m a student
                    <ArrowRight
                      className="h-4 w-4 text-primary opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                      aria-hidden
                    />
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    Sign in to lessons, exercises, grades and chat.
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/login/teacher" className="block" tabIndex={-1} aria-label="Sign in as the teacher">
            <Card className="group card-hover h-full bg-gradient-to-br from-primary-soft/70 to-accent/40 p-5 transition-transform hover:-translate-y-0.5">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <UserRound className="h-6 w-6" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-base font-semibold text-foreground">
                    I’m the teacher
                    <ArrowRight
                      className="h-4 w-4 text-primary opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                      aria-hidden
                    />
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    Welcome back, Hafsa. Manage your classes.
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        <p className="pw-rise pw-rise-5 mt-6 text-center text-xs text-muted-foreground">
          New student? Ask Hafsa for your invite code, then sign in.
        </p>
      </div>
    </div>
  );
}
