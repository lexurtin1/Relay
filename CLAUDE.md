# Relay

Internal white-labelled Calastone agent workspace prototype for Innovation and Strategy.

## Architecture (short)

- Root Next.js App Router UI (`src/`, `public/`, `theme/`)
- `apps/worker`: BullMQ agent worker
- `packages/core`: domain types, Prisma helpers, prompts, **LLM gateway**
- `packages/connectors`: Salesforce, Power BI, Jira, Confluence, Databricks, GitHub (mock/live)
- `packages/agents`: Scout and Planner (gateway-only model calls)
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
3. Scout and Planner (done)
4. Review / comments / approval (done)
5. Runner (current)
6. Reviewer, Ideas, Metrics, Audit
7. Hardening and Playwright happy path
