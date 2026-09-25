import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import tourWelcome from "@/assets/tour-welcome.png";
import tourUses from "@/assets/tour-uses.png";
import tourThanks from "@/assets/tour-thanks.png";

const SEEN_KEY = "pw-welcome-seen";

export function shouldShowWelcomeTour(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) == null;
  } catch {
    return false;
  }
}

function markWelcomeTourSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // private mode — tour simply shows again next time
  }
}

const SLIDES = [
  { src: tourWelcome, alt: "Welcome to Purple World", anim: "animate-tour-enter", ctaDelay: 1000 },
  { src: tourUses, alt: "What this website is for", anim: "animate-tour-slide", ctaDelay: 5000 },
  { src: tourThanks, alt: "Thank you for joining Purple World", anim: "animate-tour-slide", ctaDelay: 900 },
];

/**
 * First-run welcome tour for new students: gentle welcome appearance,
 * calm slide into the guided tour, 5s to read, then a soft button —
 * same motion language into the thank-you screen and entry.
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

  function finish() {
    markWelcomeTourSeen();
    onDone();
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome tour"
    >
      <div className="flex justify-end p-4">
        <button
          type="button"
          onClick={finish}
          className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          Skip
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-2">
        <img
          key={step}
          src={slide.src}
          alt={slide.alt}
          draggable={false}
          className={`max-h-full w-auto max-w-full rounded-2xl object-contain shadow-xl ${slide.anim}`}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent"
        />
      </div>

      <div className="flex min-h-[88px] items-center justify-between gap-3 px-5 pb-8">
        <div className="flex items-center gap-1.5" aria-hidden>
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={
                "h-1.5 rounded-full transition-all " +
                (i === step ? "w-6 bg-primary" : "w-1.5 bg-border")
              }
            />
          ))}
        </div>
        {ctaReady ? (
          <div key={`cta-${step}`} className="animate-tour-button">
            {step < SLIDES.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
            ) : (
              <Button onClick={finish}>Enter your space</Button>
            )}
          </div>
        ) : (
          <span className="w-[92px]" aria-hidden />
        )}
      </div>
    </div>
  );
}
