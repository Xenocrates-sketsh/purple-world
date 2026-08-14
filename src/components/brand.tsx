import { Sparkles } from "lucide-react";

import { cn } from "@/lib/cn";
import { APP_NAME } from "@/lib/config";

export function Brand({ className, subtitle }: { className?: string; subtitle?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm">
        <Sparkles className="h-5 w-5" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block text-base font-bold tracking-tight text-foreground">
          {APP_NAME}
        </span>
        {subtitle ? (
          <span className="block text-[11px] font-medium text-muted-foreground">
            BAC English Support
          </span>
        ) : null}
      </span>
    </div>
  );
}