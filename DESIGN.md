# Design

<!-- impeccable:design-schema 1 -->

## Mode

Operate

## World

Calastone agent workspace. Premium frame (top bar, command palette) with plain, solid content sheets. Status must read first; decoration stays quiet. Light theme is a composed alternate, not a mechanical invert.

## Surfaces

- Shell: one top navigation bar with brand (Relay + SS&C Calastone subtitle), section tabs (Overview, Workstreams, Knowledge; Ideas once Phase 7 ships), search / command trigger, theme toggle, agents-running status pill, user switcher. No bottom dock.
- Glass: only on the top bar and the command palette. Lists, plans, cards, and tables sit on opaque sheets with no blur behind text.
- Background: still. One static, faint brand gradient behind the top bar is enough. No drifting blobs or rotating wireframes on working pages. Wireframe art may appear on empty states only, or behind a setting that is off by default.
- Overview: page title, one problem composer with one primary action (Start research), secondary text actions (Log as idea, Search knowledge), stage count filters, Needs you (left) and Agents running (right), then a shared workstreams table with five stage columns.
- Workstream detail: five-step stage strip (Research, Plan, Review, Build, PR), one "Next step" panel at the top with a single primary action (other actions in More), then tabs (Research, Plan, Build, Activity). No sticky bottom action bar.
- Ideas, Metrics, Audit: hidden from nav until Phase 7; routes may remain.

## Tokens

Source of truth: `theme/brand.ts` and `src/app/globals.css` (`data-theme="dark"|"light"`).

- Ground dark `#060A12`, sheets `#0D131F`, ink `#F2F5FA` / muted `#A9B4C6` / body `#D5DCE8`.
- Contrast: body and muted text at least 4.5:1 against the sheet colour in both themes. Check `--relay-ink-muted` on `--relay-sheet` first.
- Colour means one thing: blue = agent running or link; amber = needs you; green = done; red = failed; grey = idle. No other accent colours. No SaaS purple.
- Calastone blues `#2B6FD6` / `#3F82E0` / `#8DBBFA` for live states and links.
- Primary actions: light fill on dark (`#F2F5FA` on `#0D131F`); blue fill on light theme. One primary button per screen; everything else secondary or text.
- Type scale: page title 28px, section heading 17px, body 14px, meta 12.5px. Geist Sans for UI; Geist Mono for IDs, paths, code. Tabular nums for counts.
- Radii: controls 12px, opaque sheets 20px. Glass reserved for top bar / palette only (no glass dock or sticky action bar).

## Motion

Quiet by default. Prefer 150ms transitions on controls. No blob drift or continuous wireframe rotation on working pages. Live agent pulse 1.6s only when an agent is actually running. Respect `prefers-reduced-motion` (no pulse).

## Components

Top nav tabs, theme toggle, timeline / stage tracks, avatar initials, status pills, "Next step" panel, command palette (Ctrl K / ⌘K), Sonner toasts, Lucide / inline SVG icons, react-markdown plan body. Five stage names everywhere: Research, Plan, Review, Build, PR.
