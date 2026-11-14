# Design

<!-- impeccable:design-schema 1 -->

## Mode

Operate

## World

Calm internal operations tool in the style of Linear, Vercel dashboard, and Stripe dashboard. Dense, precise, no marketing theatre.

## Surfaces

- Overview (home): dark header, hero band, stage stats, Needs your action + Agents running, workstreams progress table (structure from Relay dashboard redesigns PDF).
- Workstream detail: numbered stage stepper, Research / Plan / Comments columns, sticky revise/approve/hand-off bar.
- Keep rounder SaaS cards (14 to 18px) and Calastone blue + purple accent tokens.

## Tokens

Source of truth: `theme/brand.ts` and `src/app/globals.css`.

- Calastone brand blue: `#3274C0` for live agent states and research/building pills.
- SaaS purple accent: `#6B5CE7` for primary actions, focus, active nav, and progress.
- Soft lilac surfaces and violet-tinted borders; cards use 14 to 18px radii.
- Status: amber needs-you, green done/success, red failed/killed.
- Type: Gill Sans MT for page/section titles; Geist Sans for UI body/data; Geist Mono for IDs, paths, code. Tabular nums for counts.

## Motion

150ms ease-out transitions only. New activity events slide in. Agent live pulse. Respect `prefers-reduced-motion`.

## Components

Avatar initials, status pills, command palette (⌘K), Sonner toasts, Lucide icons, react-markdown plan body.
