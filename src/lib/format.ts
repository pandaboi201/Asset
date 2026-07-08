import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

/** Standard integer formatting with thousands separators. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** Percentage formatting from a 0-100 value. */
export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)}%`;
}

function toDate(value: string | number | Date): Date {
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : new Date(value);
}

/** Format a date like "Jan 4, 2026". */
export function formatDate(value: string | number | Date): string {
  const date = toDate(value);
  return isValid(date) ? format(date, "MMM d, yyyy") : "—";
}

/** Format a date + time like "Jan 4, 2026, 3:45 PM". */
export function formatDateTime(value: string | number | Date): string {
  const date = toDate(value);
  return isValid(date) ? format(date, "MMM d, yyyy, h:mm a") : "—";
}

/** Relative time like "3 hours ago". */
export function formatRelativeTime(value: string | number | Date): string {
  const date = toDate(value);
  return isValid(date) ? formatDistanceToNow(date, { addSuffix: true }) : "—";
}

/** Return initials from a full name, e.g. "Jane Doe" -> "JD". */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
