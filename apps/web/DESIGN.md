# Design

<!-- impeccable:design-schema 1 -->

## Mode

Operate

## World

Calm internal operations tool in the style of Linear, Vercel dashboard, and Stripe dashboard. Dense, precise, no marketing theatre.

## Surfaces

- Dashboard: Needs-you strip first, then a viewport-fitting board with collapsing empty stages.
- Workstream detail: stage stepper, activity timeline, plan document (~55%), margin comments, sticky action bar.

## Tokens

Source of truth: `theme/brand.ts` and `src/app/globals.css`.

- Accent: `#3274C0` (logo-sampled) for primary actions and live agent states only.
- Neutrals carry structure.
- Status: amber needs-you, green done/success, red failed/killed. Status colours only on indicators.
- Type: Gill Sans MT for page/section titles; Geist Sans for UI body/data; Geist Mono for IDs, paths, code. Tabular nums for counts.

## Motion

150ms ease-out transitions only. New activity events slide in. Agent live pulse. Respect `prefers-reduced-motion`.

## Components

Avatar initials, status pills, command palette (⌘K), Sonner toasts, Lucide icons, react-markdown plan body.
