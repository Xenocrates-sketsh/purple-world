import { cn } from "@/lib/cn";

/** Toggle chips for picking any number of groups (filters, targeting). */
export function GroupMultiSelect({
  groups,
  selected,
  onToggle,
  allLabel = "All groups",
}: {
  groups: { id: string; name: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  allLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onToggle("__all__")}
        aria-pressed={selected.length === 0}
        className={cn(
          "rounded-full border px-3 py-1.5 text-sm transition-colors",
          selected.length === 0
            ? "border-primary bg-primary-soft text-primary"
            : "border-border bg-surface-muted text-muted-foreground hover:text-foreground"
        )}
      >
        {allLabel}
      </button>
      {groups.map((g) => {
        const on = selected.includes(g.id);
        return (
          <button
            key={g.id}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(g.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              on
                ? "border-primary bg-primary-soft text-primary"
                : "border-border bg-surface-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {g.name} {on ? "✓" : ""}
          </button>
        );
      })}
    </div>
  );
}

export function toggleGroupId(selected: string[], id: string): string[] {
  if (id === "__all__") return [];
  return selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
}
