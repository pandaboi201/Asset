/**
 * Shared accent-tone palette used for icon chips, page header icons, and
 * other decorative accents across the app. Centralizing this keeps the UI
 * from defaulting everything to primary blue — each module gets a distinct
 * hue while primary blue stays reserved for brand/primary actions (buttons,
 * links, active nav, focus rings).
 */

export type AccentTone =
  | "primary"
  | "teal"
  | "purple"
  | "pink"
  | "amber"
  | "success"
  | "info"
  | "destructive";

export const ACCENT_TONE_CLASSES: Record<AccentTone, string> = {
  primary: "bg-primary/10 text-primary ring-1 ring-primary/10",
  teal: "bg-chart-3/10 text-chart-3 ring-1 ring-chart-3/20",
  purple: "bg-chart-6/10 text-chart-6 ring-1 ring-chart-6/20",
  pink: "bg-chart-5/10 text-chart-5 ring-1 ring-chart-5/20",
  amber: "bg-warning/10 text-warning ring-1 ring-warning/20",
  success: "bg-success/10 text-success ring-1 ring-success/20",
  info: "bg-info/10 text-info ring-1 ring-info/20",
  destructive: "bg-destructive/10 text-destructive ring-1 ring-destructive/20",
};
