import { useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { GraduationCap, UserRound, ArrowRight } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { Brand } from "@/components/brand";
import { Card } from "@/components/ui/card";

export function WelcomePage() {
  const { status, user, role, isTeacher, isStudent } = useAuth();
  const navigate = useNavigate();

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
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.12),transparent)]"
        aria-hidden
      />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Brand className="text-2xl" />
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Welcome to Purple World — your space for BAC English support.
          </p>
        </div>

        <div className="space-y-3">
          <Link to="/register" className="block" tabIndex={-1} aria-label="Continue as student">
            <Card className="group card-hover p-5">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  <GraduationCap className="h-6 w-6" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-base font-semibold text-foreground">
                    I am a student
                    <ArrowRight
                      className="h-4 w-4 text-primary opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                      aria-hidden
                    />
                  </p>
                  <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                    Enter your student space to access lessons, exercises, grades, schedule, and chat
                    with Hafsa.
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/login" className="block" tabIndex={-1} aria-label="Sign in as the teacher">
            <Card className="group card-hover bg-gradient-to-br from-primary-soft/60 to-accent/40 p-5">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <UserRound className="h-6 w-6" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-base font-semibold text-foreground">
                    I am the teacher
                    <ArrowRight
                      className="h-4 w-4 text-primary opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                      aria-hidden
                    />
                  </p>
                  <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                    Welcome back, Hafsa. Manage students, groups, lessons, attendance, payments, and
                    academic progress.
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Need an account? Students sign up with the invite code Hafsa provides.
        </p>
      </div>
    </div>
  );
}