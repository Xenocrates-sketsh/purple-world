import { Moon, Sun, Monitor } from "lucide-react";

import { useTheme, type ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/cn";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle({ compact }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5"
      role="radiogroup"
      aria-label="Color theme"
    >
      {OPTIONS.map((op) => {
        const Icon = op.icon;
        const active = theme === op.value;
        return (
          <button
            key={op.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${op.label} theme`}
            title={op.label}
            onClick={() => setTheme(op.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {!compact ? <span>{op.label}</span> : null}
          </button>
        );
      })}
    </div>
  );
}