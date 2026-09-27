import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

/** A row skeleton matching list rows (avatar + two lines, px-5 py-3.5). */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5" aria-hidden>
      <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    </div>
  );
}

/** Card of row skeletons matching divided list cards. */
export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div className="card overflow-hidden p-0">
      <ul className="divide-y divide-border">
        {Array.from({ length: count }).map((_, i) => (
          <li key={i}>
            <SkeletonRow />
          </li>
        ))}
      </ul>
    </div>
  );
}
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card space-y-3 p-5">
      <Skeleton className="h-4 w-2/5" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3", i % 2 === 0 ? "w-full" : "w-4/5")} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}