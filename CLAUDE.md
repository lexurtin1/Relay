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

See `docs/plan/RELAY_PLAN.md` for the full plan. Work one phase per branch.

0. Spike: Goose behind the gateway
1. Make the UI honest (actions, state machine, layout)
2. MCP layer (shared `mcp-servers.yaml`, connector adapters)
3. Scout and Planner (BullMQ + SSE)
4. Review and approval
5. Runner (sandbox, ask_human, PR)
6. Jira sync
7. Ideas, Metrics, Audit
8. Hardening and Playwright happy path

Done so far: schema, seed, branded dashboard, connectors and knowledge search (mock).
