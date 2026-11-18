# Design

<!-- impeccable:design-schema 1 -->

## Mode

Operate

## World

Light-first Calastone agent workspace. Pale ground, white elevated sheets with soft shadows, slim header, and a left sidebar. Subtle atmosphere blobs and teal-to-blue wireframe polyhedra stay low-opacity so status and actions lead. Dark theme remains a composed alternate via the theme toggle.

## Surfaces

- Heroes: every page opens with a compact hero (eyebrow, title, one purpose line, live stats, one primary action, optional visual). At most about 180px of text; collapses to a one-line strip, remembered per page.
- Shell: slim top brand bar with official SS&C Calastone lockup (PNG) on the left, then Relay mark+wordmark, command, theme toggle, user; left sidebar nav (Overview, Workstreams, Ideas, Knowledge, Metrics, Audit) with Calastone blue active state and Relay mark. User menu switches role and holds presenter tools (tour, agent speed, reset demo).
- Overview: hero with the relay pipeline (five legs, live counts, agent or person holds the baton, amber blocker badges; clicking a leg filters timelines), two-column body (timelines on the left; Needs your input on the right). Start work is a fixed floating glass box at bottom centre (does not scroll away). Lists scroll internally when needed.
- Workstream list/detail: stage chips, timeline tracks, sheet panels, sticky action bar. Workstream colour shown as a small circle (not a left border). Circles pulse when a human decision is waiting.
- Ideas board: four status columns with colour-dot cards, workstream legend, composer honouring `?draft=` from Overview.
- Research activity: calm Orbit-inspired feed (user ask bubble, numbered steps, connector disclosures, live Tools line, Ask anything composer). Keep Calastone light theme; no Orbit purple.
- Hand off to Runner modal: title, workspace subtitle, optional context, compact model and profile selectors, Cancel + Hand off.
- Atmosphere: soft blue / teal / amber blobs plus slow-rotating Calastone wireframe icosahedra at low opacity (especially on light).

## Tokens

Source of truth: `src/app/globals.css`. Astryx components read the same tokens through `src/app/astryx-theme.css` (`data-theme="light"|"dark"`). Default theme is light.

- Ground light `#F2F5FA`, sheets `#FFFFFF` with soft elevation shadow, ink `#0D131F` / muted `#4A5562` / body `#1A2233`.
- Dark alternate: ground `#060A12`, sheets `#0D131F`, ink `#F2F5FA`.
- Calastone blues `#2B6FD6` / `#3F82E0` / `#8DBBFA` for live states and links. AI Gateway purple `#7C5CFF` → blue gradient for sidebar active and selected chips (matches SS&C AI Governance).
- Primary actions: blue fill on light; light fill on dark.
- Status: amber needs-you, green done, red failed. Timeline: person `#DDE4EF`, agent `#3F82E0`, waiting hatch amber.
- Strategy workstream palette (linked tickets inherit): Context `#2B6FD6`, Rail `#0D9488`, Trust `#D97706`, Collective `#059669`, Standards `#475569`, unlinked neutral `#94A3B8`.
- Type: Geist Sans for UI; Geist Mono for IDs, paths, code. Tabular nums for counts.
- Radii: controls 12px, sheets 16px, panels 20px.

## Motion

Transitions 150ms. Blob drift (28–40s). Wireframe slow rotation. Live agent pulse 1.6s. Respect `prefers-reduced-motion` (static wireframes, no drift/pulse).

## Components

Astryx (via `src/components/ui/astryx.tsx` only): Dialog, TabList, Table, Badge, Avatar, DropdownMenu, EmptyState. Relay: page hero, relay pipeline, Next move card, Runner console, comments rail, hand-rolled SVG charts (palette validated for CVD and contrast: agent blue, person teal, waiting amber), guided tour coach. Theme toggle, sidebar nav, timeline tracks, avatar initials, status pills, command palette (⌘K), Sonner toasts, Lucide / inline SVG icons, react-markdown plan body.
