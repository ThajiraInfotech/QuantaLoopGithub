/**
 * Quanta Loop design tokens (TypeScript reference).
 * Source of truth for colors: src/styles/design-system.css
 */

export const brand = {
  charcoal: "#0F1416",
  loopGreen: "#2BAA6B",
  white: "#FFFFFF",
} as const;

export const colors = {
  background: "var(--background)",
  foreground: "var(--foreground)",
  card: "var(--card)",
  cardForeground: "var(--card-foreground)",
  primary: "var(--primary)",
  primaryForeground: "var(--primary-foreground)",
  secondary: "var(--secondary)",
  secondaryForeground: "var(--secondary-foreground)",
  muted: "var(--muted)",
  mutedForeground: "var(--muted-foreground)",
  accent: "var(--accent)",
  accentForeground: "var(--accent-foreground)",
  border: "var(--border)",
  input: "var(--input)",
  ring: "var(--ring)",
  success: "var(--success)",
  warning: "var(--warning)",
  destructive: "var(--destructive)",
} as const;

/** Spacing scale in pixels */
export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
  16: 64,
  24: 96,
  32: 128,
} as const;

/** Maps to Tailwind spacing utilities: 1→4px, 2→8px, 3→12px, 4→16px, 6→24px, etc. */
export const spacingToTailwind = {
  4: "1",
  8: "2",
  12: "3",
  16: "4",
  24: "6",
  32: "8",
  48: "12",
  64: "16",
  96: "24",
  128: "32",
} as const;

export const radius = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  "2xl": "var(--radius-2xl)",
} as const;

export const shadows = {
  subtle: "shadow-subtle",
  card: "shadow-card",
  elevated: "shadow-elevated",
} as const;

export const typography = {
  hero: { xl: "text-hero-xl", lg: "text-hero-lg", md: "text-hero-md" },
  display: "text-display",
  h1: "text-h1",
  h2: "text-h2",
  h3: "text-h3",
  h4: "text-h4",
  body: "text-body",
  small: "text-small",
  caption: "text-caption",
  eyebrow: "text-eyebrow",
} as const;

export type ButtonVariant =
  | "primary"
  | "accent"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "link";

export type CardVariant = "default" | "elevated" | "muted" | "interactive" | "stat";

export type BadgeVariant =
  | "default"
  | "accent"
  | "secondary"
  | "success"
  | "warning"
  | "destructive"
  | "outline";
