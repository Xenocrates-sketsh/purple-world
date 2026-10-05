import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, GraduationCap, School, HeartHandshake, ArrowRight, Instagram, Facebook, Globe, BadgeCheck } from "lucide-react";

import { useQuery } from "@/hooks/useFirestore";
import { ratingsQuery, submitRating, ratingStats } from "@/lib/db/ratings";
import type { RatingDoc } from "@/lib/types";
import { useToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brand } from "@/components/brand";
import { Reveal } from "@/components/reveal";
import { SilkBackground } from "@/components/silk-background";
import { cn } from "@/lib/cn";
import hafsaLogo from "@/assets/hafsa-logo.jpg";
import hafsaBanner from "@/assets/hafsa-banner.jpg";

const VOTED_KEY = "pw-rated";

function RatingWidget() {
  const { toast } = useToast();
  const ratings = useQuery<RatingDoc>((db) => ratingsQuery(db));
  const [picked, setPicked] = useState(() => {
    try {
      const n = Number(localStorage.getItem(VOTED_KEY));
      return Number.isInteger(n) && n >= 1 && n <= 5 ? n : 0;
    } catch {
      return 0;
    }
  });
  const [hovered, setHovered] = useState(0);
  const [saving, setSaving] = useState(false);
  const [voted, setVoted] = useState(() => {
    try {
      return localStorage.getItem(VOTED_KEY) != null;
    } catch {
      return false;
    }
  });

  const scores = (ratings.docs ?? []).map((d) => d.data.score).filter((s) => s >= 1 && s <= 5);
  const { count, average } = ratingStats(scores);
  const shown = hovered || picked;

  async function vote() {
    if (picked < 1 || picked > 5 || saving || voted) return;
    setSaving(true);
    try {
      await submitRating(picked);
      try {
        localStorage.setItem(VOTED_KEY, String(picked));
      } catch {
        // private mode — vote still counted
      }
      setVoted(true);
      toast("Thank you for rating!", { variant: "success" });
    } catch {
      toast("Could not save your rating — try again.", { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md p-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Rate your teacher</p>
      <div className="mt-3 flex items-center justify-center gap-1.5" role="radiogroup" aria-label="Rate from 1 to 5 stars">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={picked === s}
            aria-label={`${s} star${s === 1 ? "" : "s"}`}
            disabled={voted || saving}
            onClick={() => setPicked(s)}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            className="rounded-lg p-1 transition-transform hover:scale-125 disabled:cursor-default disabled:hover:scale-100"
          >
            <Star
              className={cn(
                "h-9 w-9 transition-colors",
                s <= shown ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
              )}
              aria-hidden
            />
          </button>
        ))}
      </div>
      {voted || count > 0 ? (
        <div className="mt-3">
          <p className="text-3xl font-bold text-foreground">
            {average.toFixed(1)}
            <span className="text-base font-normal text-muted-foreground"> / 5</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {count === 0 ? "No ratings yet — be the first!" : `${count} rating${count === 1 ? "" : "s"}`}
            {voted ? " · thanks for voting!" : ""}
          </p>
        </div>
      ) : null}
      {!voted ? (
        <Button onClick={vote} disabled={picked === 0 || saving} loading={saving} className="mt-4 w-full">
          {picked > 0 ? `Rate ${picked} star${picked === 1 ? "" : "s"}` : "Pick stars to rate"}
        </Button>
      ) : null}
    </Card>
  );
}

const TIMELINE = [
  {
    icon: GraduationCap,
    title: "Master 2 Degree",
    text: "Holds a Master 2 in English — deep training in language, literature and teaching.",
  },
  {
    icon: School,
    title: "2 years at University of Ahmed Salhi — Naama",
    text: "Taught university students for two years, from first steps to exam success.",
  },
  {
    icon: HeartHandshake,
    title: "Purple World",
    text: "Now brings BAC students, beginners, kids and adults together — lessons, activities and real communication. Studying here is fun.",
  },
];

export function MissHafsaPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <SilkBackground />

      <div className="relative mx-auto w-full max-w-4xl px-4 pb-16 pt-10">
        <div className="flex justify-center">
          <Brand className="text-xl" />
        </div>

        {/* Hero */}
        <section className="mt-8 text-center">
          <Reveal>
            <img
              src={hafsaLogo}
              alt="Miss Hafsa"
              className="mx-auto h-40 w-40 rounded-full border-4 border-primary/40 object-cover shadow-xl sm:h-52 sm:w-52"
            />
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              English · BAC · All levels
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Studying English with{" "}
              <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                Miss Hafsa
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Welcome to English with Miss Hafsa — where BAC students conquer exams, beginners
              find their voice, and kids and adults learn to speak with confidence. Lessons,
              activities and real communication — welcome to our world, where studying is fun.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to="/login">
                <Button size="lg">
                  Join Purple World <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
            </div>
          </Reveal>
        </section>

        {/* Banner */}
        <section className="mt-12">
          <Reveal>
            <img
              src={hafsaBanner}
              alt="Bac lessons, A1/A2 levels and communication classes with Miss Hafsa"
              className="w-full rounded-2xl border border-border object-cover shadow-lg"
              loading="lazy"
            />
          </Reveal>
        </section>

        {/* Experience */}
        <section className="mt-12">
          <Reveal>
            <h2 className="text-center text-2xl font-bold text-foreground">Experience</h2>
          </Reveal>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {TIMELINE.map((t, i) => (
              <Reveal key={t.title} delay={i * 110}>
                <Card className="h-full p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <t.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="mt-3 font-semibold text-foreground">{t.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.text}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Rating */}
        <section className="mt-12">
          <Reveal>
            <h2 className="text-center text-2xl font-bold text-foreground">Loved by her students</h2>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-6">
              <RatingWidget />
            </div>
          </Reveal>
        </section>

        {/* Finale quote */}
        <section className="mt-12 text-center">
          <Reveal>
            <BadgeCheck className="mx-auto h-8 w-8 text-primary" aria-hidden />
            <blockquote className="mx-auto mt-4 max-w-2xl text-xl font-bold italic leading-relaxed text-foreground sm:text-2xl">
              “You don't need luck to perform, you decide when to perform good… and WIN.”
            </blockquote>
            <p className="mt-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
              — Miss Hafsa
            </p>
          </Reveal>
        </section>

        {/* Socials */}
        <footer className="mt-12 border-t border-border pt-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://www.instagram.com/miss.hafsa.ler?stkn=NjFrM2xucmJsczFs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Instagram className="h-4 w-4" aria-hidden /> Instagram
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61593245784029"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Facebook className="h-4 w-4" aria-hidden /> Facebook
            </a>
            <a
              href="https://purple-world-three.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Globe className="h-4 w-4" aria-hidden /> Official website
            </a>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Purple World — English with Miss Hafsa
          </p>
        </footer>
      </div>
    </div>
  );
}
