# Relay

Internal white-labelled Calastone agent workspace prototype for Innovation and Strategy.

## Architecture (short)

- Root Next.js App Router UI (`src/`, `public/`, `theme/`)
- `apps/worker`: BullMQ agent worker
- `packages/core`: domain types, Prisma helpers, prompts, **LLM gateway**
- `packages/connectors`: Salesforce, Power BI, Jira, Confluence, Databricks, GitHub (mock/live)
- Postgres via Prisma, Redis via BullMQ, SSE for live agent activity

## Hard rules

- Every model call goes through `packages/core/src/llm/gateway.ts` (imported as `@relay/core` / `@relay/core/llm/gateway`).
- Never call Anthropic, OpenAI, or any other provider directly.
- Default mode is `RELAY_MODE=mock`.
- Product name is `APP_NAME` (default `Relay`).
- No production data in Runner workspaces.
- Do not invent facts about real Calastone clients, systems, or brand colours beyond provided assets.
- No em dashes in UI copy, docs, or comments.

## Commands

```bash
pnpm install
pnpm db:generate
pnpm db:migrate:dev
pnpm db:seed
pnpm dev

# Full local stack (Postgres, Redis, web, worker)
docker compose up --build
```

Tests: `pnpm test`

## Milestones

1. Skeleton: schema, seed, branded dashboard (done)
2. Connectors and knowledge search (done)
3. Scout and Planner (simulated in demo mode; worker processors pending)
4. Review / comments / approval (demo mode done; database actions pending)
5. Runner (simulated in demo mode)
6. Reviewer, Ideas, Metrics, Audit (Ideas, Metrics, Audit done in demo mode)
7. Hardening and Playwright happy path (happy path in `e2e/`)

## Demo mode

With no `DATABASE_URL`, the UI runs on the browser store in `src/lib/demo-store/`. Every button dispatches through `useRelayActions()`; permissions live in `permissions.ts` and are shared by the reducer and the UI. Import Astryx only through `src/components/ui/astryx.tsx`. Client code imports `@relay/core/domain`, never `@relay/core` (it pulls in Prisma).
