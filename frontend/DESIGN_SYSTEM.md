# Quanta Loop Design System

Industrial premium B2B foundation. Reference: Linear, Stripe, Notion.

**Do not use:** gradients, glassmorphism, bright startup palettes, marketplace patterns, excessive motion.

---

## Files

| File | Purpose |
|------|---------|
| `src/styles/design-system.css` | CSS variables + `@theme` (Tailwind v4 source of truth) |
| `src/app/globals.css` | Imports Tailwind + design system |
| `tailwind.config.ts` | IDE / team reference (v4 theme is CSS-first) |
| `src/lib/design-tokens.ts` | TypeScript token map |
| `src/components/ui/*` | Primitive components |

---

## Brand

| Token | Value |
|-------|--------|
| Charcoal (primary) | `#0F1416` |
| Loop Green (accent) | `#2BAA6B` |
| Background | `#FFFFFF` |

---

## Semantic colors (CSS variables)

Use Tailwind utilities: `bg-primary`, `text-muted-foreground`, `border-border`, etc.

- `--background` / `--foreground`
- `--card` / `--card-foreground`
- `--primary` / `--primary-foreground`
- `--secondary` / `--secondary-foreground`
- `--muted` / `--muted-foreground`
- `--accent` / `--accent-foreground`
- `--border` / `--input` / `--ring`
- `--success` / `--warning` / `--destructive` (+ muted variants)

---

## Typography

| Role | Utility | Font |
|------|---------|------|
| Hero XL | `text-hero-xl` | Sora |
| Hero LG | `text-hero-lg` | Sora |
| Hero MD | `text-hero-md` | Sora |
| Display | `text-display` | Sora |
| H1–H4 | `text-h1` … `text-h4` | Sora |
| Body | `text-body` | Inter |
| Small | `text-small` | Inter |
| Caption | `text-caption` | Inter |
| Eyebrow | `text-eyebrow` | Inter (uppercase label) |

Headings: add `font-heading` when not using a heading utility.

---

## Spacing

Scale (px): **4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128**

Tailwind mapping: `p-1` (4px) · `p-2` (8px) · `p-3` (12px) · `p-4` (16px) · `p-6` (24px) · `p-8` (32px) · `p-12` (48px) · `p-16` (64px) · `p-24` (96px) · `p-32` (128px)

---

## Radius

| Token | Value | Utility |
|-------|-------|---------|
| sm | 4px | `rounded-sm` |
| md | 6px | `rounded-md` |
| lg | 8px | `rounded-lg` |
| xl | 12px | `rounded-xl` |
| 2xl | 16px | `rounded-2xl` |

Default cards/buttons: `rounded-md` or `rounded-xl` for cards.

---

## Shadows

| Token | Utility | Use |
|-------|---------|-----|
| subtle | `shadow-subtle` | Inputs, subtle lift |
| card | `shadow-card` | Default cards |
| elevated | `shadow-elevated` | Modals, dropdowns, toasts |

---

## Buttons

Variants: `primary` · `accent` · `secondary` · `outline` · `ghost` · `destructive` · `link`

Sizes: `sm` · `md` · `lg`

```tsx
<Button variant="primary">Primary action</Button>
<Button variant="accent">Positive / brand</Button>
<Button variant="outline">Secondary</Button>
```

---

## Cards

Variants: `default` · `elevated` · `muted` · `interactive` · `stat`

```tsx
<Card variant="default">…</Card>
<Card variant="interactive">Clickable row</Card>
<StatCard label="Active materials" value={12} />
```

---

## Inputs

`Input`, `Textarea`, `Label` — border `border-input`, focus ring `ring-ring`.

---

## Badges

Variants: `default` · `accent` · `secondary` · `success` · `warning` · `destructive` · `outline`

Operational priority: prefer `outline` or `secondary` over loud colors.

---

## Empty states

```tsx
<EmptyState
  title="No coordination threads"
  description="Threads appear after an interest is accepted."
  action={<Button variant="outline">View interests</Button>}
/>
```

---

## Section headers

```tsx
<SectionHeader
  eyebrow="Operations"
  title="Interest inbox"
  description="Signals awaiting your decision."
  action={<Button size="sm">Refresh</Button>}
/>
```

---

## Dashboard stats

```tsx
<StatCard label="Response rate" value="88%" hint="Last 30 days" />
```

---

## Page redesign checklist (later)

When migrating a page:

1. Replace `zinc-*` with semantic tokens (`foreground`, `muted`, `border`).
2. Use `font-heading` + `text-h*` for titles.
3. Use `Card variant="…"` instead of ad-hoc borders.
4. Use `SectionHeader` for page intros.
5. Keep motion minimal (color/opacity only).
