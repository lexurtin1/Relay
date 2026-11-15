# Design

<!-- impeccable:design-schema 1 -->

## Mode

Operate

## World

Dark glass Calastone agent workspace. Soft colour atmosphere, translucent chrome, and subtle teal-to-blue wireframe polyhedra in the background. Light theme is a composed alternate, not a mechanical invert.

## Surfaces

- Shell: fixed brand bar (Relay + SS&C Calastone subtitle), glass status pill, theme toggle, bottom glass dock (Overview, Workstreams, Ideas, Knowledge, Metrics). Audit linked from Metrics.
- Overview: large title, Start work glass composer, Needs your input sheets, Workstream timelines with segmented bars.
- Workstream list/detail: stage chips, timeline tracks, sheet panels, glass sticky action bar.
- Atmosphere: drifting blue / teal / amber blobs plus slow-rotating Calastone wireframe icosahedra at low opacity.

## Tokens

Source of truth: `theme/brand.ts` and `src/app/globals.css` (`data-theme="dark"|"light"`).

- Ground dark `#060A12`, sheets `#0D131F`, ink `#F2F5FA` / muted `#A9B4C6` / body `#D5DCE8`.
- Calastone blues `#2B6FD6` / `#3F82E0` / `#8DBBFA` for live states and links. No SaaS purple.
- Primary actions: light fill on dark (`#F2F5FA` on `#0D131F`); blue fill on light theme.
- Status: amber needs-you, green done, red failed. Timeline: person `#DDE4EF`, agent `#3F82E0`, waiting hatch amber.
- Type: Geist Sans for UI; Geist Mono for IDs, paths, code. Tabular nums for counts.
- Radii: controls 12px, sheets 20px, glass panels / dock 26px.

## Motion

Glass transitions 150ms. Blob drift (28–40s). Wireframe slow rotation. Live agent pulse 1.6s. Respect `prefers-reduced-motion` (static wireframes, no drift/pulse).

## Components

Theme toggle, dock nav, timeline tracks, avatar initials, status pills, command palette (⌘K), Sonner toasts, Lucide / inline SVG icons, react-markdown plan body.
