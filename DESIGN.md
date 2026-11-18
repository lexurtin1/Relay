# Design

<!-- impeccable:design-schema 1 -->

## Mode

Operate

## World

Light-first Calastone agent workspace. Pale ground, white elevated sheets with soft shadows, slim header, and a left sidebar. Subtle atmosphere blobs and teal-to-blue wireframe polyhedra stay low-opacity so status and actions lead. Dark theme remains a composed alternate via the theme toggle.

## Surfaces

- Shell: slim top brand bar with official SS&C Calastone lockup (PNG) on the left, then Relay mark+wordmark, command, theme toggle, user; left sidebar nav (Overview, Workstreams, Ideas, Knowledge, Metrics) with Calastone blue active state and Relay mark. Audit linked from Metrics.
- Overview: compact title, horizontal KPI row, two-column body (Start work + timelines on the left; Needs your input tickets stacked on the right). Desktop viewport fits without page scroll; lists scroll internally when needed.
- Workstream list/detail: stage chips, timeline tracks, sheet panels, sticky action bar. Workstream colour accent on list rows, detail header, research feed, and Hand off CTA.
- Ideas board: four status columns with colour-strip cards, workstream legend, composer honouring `?draft=` from Overview.
- Research activity: calm Orbit-inspired feed (user ask bubble, numbered steps, connector disclosures, live Tools line, Ask anything composer). Keep Calastone light theme; no Orbit purple.
- Hand off to Runner modal: title, workspace subtitle, optional context, compact model and profile selectors, Cancel + Hand off.
- Atmosphere: soft blue / teal / amber blobs plus slow-rotating Calastone wireframe icosahedra at low opacity (especially on light).

## Tokens

Source of truth: `theme/brand.ts` and `src/app/globals.css` (`data-theme="light"|"dark"`). Default theme is light.

- Ground light `#F2F5FA`, sheets `#FFFFFF` with soft elevation shadow, ink `#0D131F` / muted `#4A5562` / body `#1A2233`.
- Dark alternate: ground `#060A12`, sheets `#0D131F`, ink `#F2F5FA`.
- Calastone blues `#2B6FD6` / `#3F82E0` / `#8DBBFA` for live states, links, and sidebar active fill. No SaaS purple.
- Primary actions: blue fill on light; light fill on dark.
- Status: amber needs-you, green done, red failed. Timeline: person `#DDE4EF`, agent `#3F82E0`, waiting hatch amber.
- Strategy workstream palette (linked tickets inherit): Context `#2B6FD6`, Rail `#0D9488`, Trust `#D97706`, Collective `#059669`, Standards `#475569`, unlinked neutral `#94A3B8`.
- Type: Geist Sans for UI; Geist Mono for IDs, paths, code. Tabular nums for counts.
- Radii: controls 12px, sheets 16px, panels 20px.

## Motion

Transitions 150ms. Blob drift (28–40s). Wireframe slow rotation. Live agent pulse 1.6s. Respect `prefers-reduced-motion` (static wireframes, no drift/pulse).

## Components

Theme toggle, sidebar nav, timeline tracks, avatar initials, status pills, command palette (⌘K), Sonner toasts, Lucide / inline SVG icons, react-markdown plan body.
