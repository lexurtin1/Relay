# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are engineers on the SS&C Calastone Innovation and Strategy team. They move pieces of work from problem to shipped change, often several in parallel, and need a calm operations surface that shows what is waiting on them. Architects approve plans. Leads triage ideas and see metrics. Viewers are read-only.

## Product Purpose

Relay is an internal white-labelled agent workspace. An engineer researches a problem with internal knowledge connectors, drafts and revises an implementation plan with teammates, hands an approved plan to an isolated build Runner, answers questions when the Runner pauses, and tracks every workstream on one dashboard. Success is completing the full mock-mode workflow without leaving the app, with clear stage, ownership, and human-blocking state at a glance.

## Positioning

One workspace that owns the path from problem to PR with research, plan review, approval, and isolated build agents, modelled on Stripe Orbit. Neighbouring tools (Jira, Confluence, chat) do not own that end-to-end agent hand-off loop.

## Operating Context

Used at a desk in a corporate environment alongside Jira, Confluence, Salesforce, Power BI, Databricks, and GitHub. Default run mode is mock with seeded Calastone-flavoured fiction. Live connectors and the SS&C AI Gateway are configuration switches. Product name is a single config value (`APP_NAME`, default `Relay`).

## Capabilities and Constraints

- Workstreams progress through stages: idea, research, planning, in_review, approved, building, awaiting_input, pr_open, merged, killed.
- Roles: engineer, architect, lead, viewer. Architect approval required before Runner hand-off.
- All model calls go through the SS&C AI Gateway module; never call providers directly.
- No production data in Runner workspaces. Research connectors are read-only.
- Prototype must run with Docker Compose in mock mode offline when no gateway key is set.
- Open decisions: official full brand palette beyond logo-sampled primary; live SSO; real connector credentials.

## Brand Commitments

- Name: Relay (configurable via `APP_NAME`). Parent brand: SS&C Calastone.
- Voice: calm, precise, dense. Internal ops tool, not marketing.
- Visual constraints (binding from product owner): light-first Calastone Operate shell (sidebar + elevated white sheets) with dark theme via toggle. Soft colour atmosphere blobs and subtle teal-to-blue wireframe polyhedra stay subordinate to status and actions. No emoji. Calastone blues from `theme/brand.ts` for live states, links, and sidebar active; no SaaS purple. Status colours only on status indicators (amber = needs you, green = done, red = failed). Typography: Geist Sans for UI; Geist Mono for IDs, paths, and code. Tabular numbers for counts. Logo assets under `public/brand/` remain available; shell brand line uses product name plus SS&C Calastone subtitle.
- Do not invent real Calastone clients, systems, or unconfirmed brand colours.

## Evidence on Hand

- Logo PNGs: `public/brand/logo-light.png`, `logo-dark.png`, and derivatives.
- Theme tokens: `theme/brand.ts` and `src/app/globals.css` (light default `#F2F5FA` sheets on pale ground; dark `data-theme` alternate; Calastone blues `#2B6FD6` / `#3F82E0`).
- Seeded demo story: five workstreams at different stages, six ideas, fictional users.
- Screenshots: `docs/screenshots/` (Milestone 1 baseline).

## Product Principles

1. Human blockers are first-class: anything waiting on the engineer is obvious and actionable.
2. Density without noise: every pixel earns its place; decoration never competes with status.
3. Stage truth over ceremony: the board and detail view always reflect where work really is.
4. Mock fidelity: the offline demo must feel like Calastone operations without claiming real data.
5. Auditability: approvals, hand-offs, and model use are visible and logged.

## Accessibility & Inclusion

Keyboard operable primary flows (including Cmd+K command palette). Visible focus states. Status must not rely on colour alone. Target WCAG 2.2 AA for interactive surfaces unless a stricter SS&C standard is later supplied.
