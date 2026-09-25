import { format, formatDistanceToNow } from "date-fns";
import type { Timestamp } from "firebase/firestore";

export type TimeLike = Timestamp | Date | number | string | null | undefined;

export function toDate(value: TimeLike): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") return new Date(value);
  if (typeof value === "object" && "toDate" in value) return value.toDate();
  return null;
}

export function formatDate(value: TimeLike): string {
  const d = toDate(value);
  return d ? format(d, "MMM d, yyyy") : "—";
}

export function formatDateShort(value: TimeLike): string {
  const d = toDate(value);
  return d ? format(d, "MMM d") : "—";
}

export function formatTime(value: TimeLike): string {
  const d = toDate(value);
  return d ? format(d, "h:mm a") : "—";
}

export function formatDateTime(value: TimeLike): string {
  const d = toDate(value);
  return d ? format(d, "MMM d, yyyy • h:mm a") : "—";
}

export function formatWeekday(value: TimeLike): string {
  const d = toDate(value);
  return d ? format(d, "EEEE") : "—";
}

export function formatRelative(value: TimeLike): string {
  const d = toDate(value);
  if (!d) return "—";
  const diff = d.getTime() - Date.now();
  if (Math.abs(diff) < 60_000) return "just now";
  return formatDistanceToNow(d, { addSuffix: true });
}

/** "17:00" style clock string for a Date (used by schedule slots). */
export function toClock(d: Date): string {
  return format(d, "HH:mm");
}

export function formatPercent(part: number, whole: number): string {
  if (whole <= 0) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}

export function formatScore(value: number | null | undefined, max = 20): string {
  if (value == null) return "—";
  return `${Number(value.toFixed(2))} / ${max}`;
}

export function formatMoney(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${Number(value.toFixed(0)).toLocaleString()} DZD`;
}

/** Convert a "HH:mm" clock string to a Date on a given day. */
export function clockToDate(clock: string, day?: Date): Date {
  const base = day ?? new Date();
  const [h, m] = clock.split(":").map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function truncate(text: string | null | undefined, max = 80): string {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Algerian mobile numbers: +213 followed by 5, 6 or 7, then 8 digits.
 * Accepts "+213…", "0213…"-less local "05/06/07…" and spaced/dashed input.
 * Returns the normalized "+213XXXXXXXXX" form, or null when invalid.
 * No OTP/confirmation — schema check only.
 */
export function normalizeDZPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.trim().replace(/[\s.\-()]/g, "");
  let rest: string | null = null;
  if (/^\+213[567]\d{8}$/.test(digits)) {
    rest = digits.slice(4);
  } else if (/^00213[567]\d{8}$/.test(digits)) {
    rest = digits.slice(5);
  } else if (/^0[567]\d{8}$/.test(digits)) {
    rest = digits.slice(1);
  } else if (/^[567]\d{8}$/.test(digits)) {
    rest = digits;
  }
  if (!rest) return null;
  return `+213${rest}`;
}

/** True for values that look like a phone attempt (vs a student number). */
export function looksLikePhone(raw: string): boolean {
  const v = raw.trim();
  return v.startsWith("+") || /^0/.test(v) || /^[\d\s.\-()]{9,}$/.test(v);
}

export function pluralize(n: number, word: string, plural?: string): string {
  return `${n} ${n === 1 ? word : (plural ?? `${word}s`)}`;
}

/** Format a number as a fraction string like "18/20". */
export function fraction(n: number, max: number): string {
  return `${n}/${max}`;
}