"use client";

import * as React from "react";
import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AuthShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute -top-40 left-1/2 h-[460px] w-[700px] -translate-x-1/2 rounded-full bg-purple-400/20 blur-3xl dark:bg-purple-600/20" />
        <div className="absolute -bottom-40 -right-24 h-[380px] w-[380px] rounded-full bg-fuchsia-300/15 blur-3xl dark:bg-fuchsia-600/10" />
      </div>

      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {footer && (
        <footer className="pb-6 text-center text-sm text-muted-foreground">
          {footer}
        </footer>
      )}
    </div>
  );
}
