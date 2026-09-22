import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-24 w-24 text-2xl",
} as const;

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name?: string | null;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  // If the image fails to load (deleted file, paused storage bucket,
  // offline), fall back to initials instead of a broken-image glyph.
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const showImg = Boolean(src) && !failed;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-muted text-primary font-semibold",
        SIZES[size],
        className
      )}
      aria-hidden
    >
      {showImg ? (
        <img
          src={src!}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}