import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import tourWelcome from "@/assets/tour-welcome.webp";
import tourUses from "@/assets/tour-uses.webp";
import tourThanks from "@/assets/tour-thanks.webp";

const SLIDES = [
  { src: tourWelcome, alt: "Welcome to Purple World", ctaDelay: 1000 },
  { src: tourUses, alt: "What this website is for", ctaDelay: 5000 },
  { src: tourThanks, alt: "Thank you for joining Purple World", ctaDelay: 900 },
];

/**
 * First-run welcome tour: fullscreen scenes with a slow cinematic
 * crossfade (no slides, no wipes) — welcome, guided tour with 5s to
 * read, thank-you, then entry. The caller persists "seen" per account.
 */
export function WelcomeTour({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [ctaReady, setCtaReady] = useState(false);
  const slide = SLIDES[step];

  useEffect(() => {
    setCtaReady(false);
    const t = setTimeout(() => setCtaReady(true), slide.ctaDelay);
    return () => clearTimeout(t);
  }, [step, slide.ctaDelay]);

  return (
    <div
      className="fixed inset-0 z-[90] bg-background"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome tour"
    >
      <img
        key={step}
        src={slide.src}
        alt={slide.alt}
        draggable={false}
        className="animate-tour-cinematic absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/60 to-transparent"
      />

      <div className="absolute right-4 top-4">
        <button
          type="button"
          onClick={onDone}
          className="rounded-full bg-black/30 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/50"
        >
          Skip
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex min-h-[88px] items-center justify-between gap-3 px-5 pb-8">
        <div className="flex items-center gap-1.5" aria-hidden>
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={
                "h-1.5 rounded-full transition-all " +
                (i === step ? "w-6 bg-white" : "w-1.5 bg-white/40")
              }
            />
          ))}
        </div>
        {ctaReady ? (
          <div key={`cta-${step}`} className="animate-tour-button">
            {step < SLIDES.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
            ) : (
              <Button onClick={onDone}>Enter your space</Button>
            )}
          </div>
        ) : (
          <span className="w-[92px]" aria-hidden />
        )}
      </div>
    </div>
  );
}
