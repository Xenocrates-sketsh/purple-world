import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-purple-600 to-purple-800 text-base font-bold text-white shadow-sm",
        className
      )}
      aria-hidden
    >
      P
    </div>
  );
}

export function Logo({
  className,
  wordmark = true,
  size = "md",
}: {
  className?: string;
  wordmark?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={size === "lg" ? "h-11 w-11 text-xl" : size === "sm" ? "h-7 w-7 text-sm" : undefined} />
      {wordmark && (
        <span
          className={cn(
            "font-semibold tracking-tight text-foreground",
            size === "lg" ? "text-lg" : size === "sm" ? "text-sm" : "text-base"
          )}
        >
          Purple <span className="text-primary">World</span>
        </span>
      )}
    </div>
  );
}
