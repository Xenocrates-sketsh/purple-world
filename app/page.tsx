"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  GraduationCap,
  Sparkles,
  BookOpenCheck,
  UserRound,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" as const, delay },
});

export default function WelcomePage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [step, setStep] = React.useState<"intro" | "roles">("intro");
  const [introDone, setIntroDone] = React.useState(false);

  React.useEffect(() => {
    if (step !== "intro") return;
    const t = window.setTimeout(() => setIntroDone(true), 1400);
    return () => window.clearTimeout(t);
  }, [step]);

  const t = reduce ? 0 : 1;
  const duration = (s: number) => (reduce ? 0 : s);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-purple-400/20 blur-3xl dark:bg-purple-600/20" />
        <div className="absolute -bottom-48 -left-24 h-[420px] w-[420px] rounded-full bg-fuchsia-300/15 blur-3xl dark:bg-fuchsia-600/10" />
        <div className="absolute -right-24 top-1/3 h-[380px] w-[380px] rounded-full bg-indigo-300/15 blur-3xl dark:bg-indigo-600/10" />
      </div>

      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="inline-flex h-9 items-center gap-1 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            Skip
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {step === "intro" ? (
              <motion.div
                key="intro"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -16, transition: { duration: duration(0.25) } }}
                transition={{ duration: duration(0.4) }}
                className="flex flex-col items-center text-center"
              >
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: duration(0.6), ease: "easeOut", delay: 0.05 }}
                >
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-violet-500 via-purple-600 to-purple-800 text-3xl font-bold text-white shadow-elevated">
                      P
                    </div>
                    <Sparkles className="absolute -right-2 -top-2 h-6 w-6 text-amber-400" aria-hidden />
                  </div>
                </motion.div>

                <motion.h1
                  {...fade(0.15 * t + 0.1)}
                  className="mt-8 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
                >
                  Welcome to Purple World
                </motion.h1>

                <motion.p
                  {...fade(0.2 * t + 0.2)}
                  className="mt-3 max-w-sm text-base text-muted-foreground sm:text-lg"
                >
                  Your space for BAC English support. Lessons, exercises, grades,
                  and everything you need — organised by Hafsa.
                </motion.p>

                <AnimatePresence>
                  {introDone && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: duration(0.3) }}
                      className="mt-9"
                    >
                      <button
                        onClick={() => setStep("roles")}
                        className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-7 text-base font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
                      >
                        Get started
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="roles"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration(0.3) }}
              >
                <motion.h2
                  {...fade(0.05 * t)}
                  className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
                >
                  Who are you?
                </motion.h2>
                <motion.p
                  {...fade(0.1 * t + 0.05)}
                  className="mt-2 text-center text-muted-foreground"
                >
                  Choose your space to continue.
                </motion.p>

                <div className="mt-8 grid gap-4">
                  <RoleCard
                    icon={GraduationCap}
                    accent="from-violet-500 to-purple-600"
                    title="Student"
                    description="Enter your student space to access lessons, exercises, grades, your schedule and messages with Hafsa."
                    primaryLabel="Continue as student"
                    primaryHref="/login?next=/student&role=student"
                    secondaryLabel="New? Join with your group code"
                    secondaryHref="/register"
                    delay={reduce ? 0 : 0.1}
                    onEnter={() => {
                      router.push("/login?next=/student&role=student");
                    }}
                  />
                  <RoleCard
                    icon={UserRound}
                    accent="from-purple-700 to-purple-900"
                    title="Teacher"
                    description="Welcome back, Hafsa. Manage your students, groups, lessons, attendance, payments and academic progress."
                    primaryLabel="Sign in as teacher"
                    primaryHref="/login?next=/teacher&role=teacher"
                    secondaryLabel="Teacher tools"
                    secondaryHref="/login?next=/teacher&role=teacher"
                    delay={reduce ? 0 : 0.2}
                    onEnter={() => {
                      router.push("/login?next=/teacher&role=teacher");
                    }}
                  />
                </div>

                <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                  <BookOpenCheck className="h-4 w-4 text-primary" aria-hidden />
                  A private digital classroom for BAC English.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <button
        onClick={() => setStep("intro")}
        className={cn(
          "fixed bottom-5 right-5 rounded-xl border border-border bg-surface p-2 text-muted-foreground shadow-sm transition-opacity hover:text-foreground",
          step === "intro" ? "pointer-events-none opacity-0" : "opacity-100"
        )}
        aria-label="Back to introduction"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function RoleCard({
  icon: Icon,
  accent,
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  delay,
  onEnter,
}: {
  icon: React.ElementType;
  accent: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  delay: number;
  onEnter?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
      className="group flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm",
            accent
          )}
        >
          <Icon className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href={primaryHref}
          onClick={onEnter}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:scale-[0.98]"
        >
          {primaryLabel}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link
          href={secondaryHref}
          className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          {secondaryLabel}
        </Link>
      </div>
    </motion.div>
  );
}
