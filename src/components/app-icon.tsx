import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

interface AppIconProps {
  icon: LucideIcon | string;
  className?: string;
  label?: string;
}

/**
 * Renders either a Lucide component or a 3D PNG icon (src/assets/icons).
 * PNGs are full-color, so they ignore text color — active state still shows
 * through the surrounding background pill.
 */
export function AppIcon({ icon, className, label }: AppIconProps) {
  if (typeof icon === "string") {
    return (
      <img
        src={icon}
        alt={label ?? ""}
        aria-hidden={label == null}
        draggable={false}
        className={cn("shrink-0 object-contain", className)}
      />
    );
  }
  const Icon = icon;
  return <Icon className={className} aria-hidden />;
}
