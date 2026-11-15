# Relay: implementation and redesign plan

Prepared 15 November 2026 from a review of `lexurtin1/Relay` at commit `790b32b`.
Work one phase at a time: start each Cursor task with this file and the active phase only.

## 1. Current state

Relay is a well-structured shell with no working engine yet. The data model, UI pages and connector interfaces are in place. Nothing that does the work (research, planning, building, Jira sync) runs.

| Area | State today | Evidence |
| --- | --- | --- |
| Data model | Complete for the Orbit loop: workstreams, research runs, plans with versions and steps, anchored comments, approvals, runner jobs, agent events, questions, ideas, audit log | `prisma/schema.prisma` |
| Demo mode | Works without a database through fixtures | `src/lib/db.ts`, `src/lib/demo-data.ts` |
| Overview | Start work composer (3 modes), Needs your input cards, workstream timelines | `src/components/overview.tsx` |
| Workstream detail | Stage stepper, plan document, anchored comments, action bar | `src/components/workstream-detail.tsx` |
| Action bar | Buttons render but have no handlers. Revise, Approve and Hand off do nothing | `src/components/action-bar.tsx` |
| Needs your input | Option buttons link to the workstream page instead of answering | `overview.tsx`, `NeedsInputSection` |
| New workstream | Five-field form; creates a record at stage `idea`; nothing starts | `src/app/workstreams/new/page.tsx`, `src/app/actions.ts` |
| Knowledge search | Works against a mock corpus. Live connectors also return mock data | `packages/connectors/src/live-connector.ts` |
| Gateway | Single text call to `/v1/messages`. No tool-use loop, no streaming | `packages/core/src/llm/gateway.ts` |
| Worker | Heartbeat only. No queues, no processors | `apps/worker/src/index.ts` |
| Ideas, Metrics, Audit | Placeholder pages. Ideas and Metrics are in the dock; Audit is linked from Metrics | `src/app/ideas`, `metrics`, `audit` |
| Header | "Agents running" pill always reads "Workspace ready" because the count is never passed | `src/components/header.tsx`, `src/app/layout.tsx` |
| Visual layer | Fixed glass header, floating glass dock, sticky glass action bar, drifting colour blobs and rotating wireframe polyhedra behind content | `layout.tsx`, `atmosphere.tsx`, `calastone-wireframes.tsx` |
| Jira | Stored as a free-text key only. No sync | `Workstream.jiraKey` |

Two things are worth keeping exactly as they are: the schema, and the rule that every model call goes through the SS&C AI Gateway module.

## 2. Target architecture

Relay stays the workspace: the dashboard, plans, comments, approvals and the "Needs you" list. It stops trying to be the agent. Two open-source pieces do the agent work, and the MCP servers you are already connecting to LibreChat supply the data.

```
Browser
  |
Relay web (Next.js)  ---- Postgres (Prisma)
  |                          ^
  | enqueue jobs             | events, findings, questions, results
  v                          |
Redis (BullMQ)  --->  Relay worker
                          |
                          |-- Scout job: Goose, read-only MCP servers, Relay MCP
                          |-- Planner job: gateway call, structured JSON plan
                          |-- Runner job: Goose in a Docker sandbox, git worktree, Relay MCP
                          |
                          +--> SS&C AI Gateway (all model traffic)

Shared MCP servers (same config as LibreChat):
  Atlassian (Jira, Confluence), internal data-analysis (Databricks, contracts),
  Salesforce, Power BI, GitHub

Relay MCP server (new, small): ask_human, report_progress, record_finding, finish
```

### Decisions

1. **Agent engine: Goose (Block, open source).** Stripe's Minions are a fork of Goose. It runs headless (`goose run -i plan.md`), supports recipes (versioned YAML workflows), takes MCP servers as extensions, and can point at a custom Anthropic-compatible host through `ANTHROPIC_HOST` or `GOOSE_PROVIDER__HOST`. Use one engine with two recipes: `scout` (read-only) and `runner` (writes code in a sandbox).
   - Fallback if Goose does not fit: LangChain Open SWE, which has plan approval built in but is heavier and GitHub-centric.
2. **Human in the loop through Relay's own MCP server.** The agent calls `ask_human(question, options)`. The tool writes a `Question` row, sets the workstream to `awaiting_input`, and waits until the engineer answers in Relay. This is how Orbit's "it might pause and ask for input" works, and it needs no change to Goose.
3. **One MCP config shared with LibreChat.** Keep a single `mcp-servers.yaml` that both LibreChat and Relay read, so connections and credentials are managed once.
4. **Planner stays a direct gateway call.** Planning is one structured request: findings in, JSON plan out. It does not need an agent loop.
5. **Jira stays the system of record.** Relay creates or links the Jira issue and pushes stage changes and the PR link through the Atlassian MCP server. Engineers keep their Jira boards.

### Things to confirm with SS&C before Phase 5

- The gateway's auth header. Goose's Anthropic provider sends `x-api-key`. If the gateway expects a bearer token or another header, use a Goose custom provider definition or a small header-rewriting proxy.
- Whether Runner sandboxes may open pull requests on real repos or only a sandbox GitHub org (already listed in `docs/security.md`).
- Retention for prompts, findings and audit logs.

## 3. Implementation phases

Each phase ends with something demonstrable. Do Phase 0 first: it is a focused spike of the riskiest part.

### Phase 0. Spike: Goose behind the gateway

Goal: prove the loop end to end outside the UI.

- Install the Goose CLI in `docker/Dockerfile.runner`.
- Point Goose at the gateway (`GOOSE_PROVIDER=anthropic`, `ANTHROPIC_HOST=$AI_GATEWAY_BASE_URL`, `ANTHROPIC_API_KEY=$AI_GATEWAY_API_KEY`, `GOOSE_MODEL=$MODEL_ID`).
- Create `demo-repos/sample-service` (a small TypeScript service with tests).
- Write a minimal Relay MCP server (`packages/relay-mcp`) with `ask_human` that prints the question and reads an answer from stdin.
- Run: `goose run --recipe recipes/runner.yaml --params plan=@plan.md` inside the container against a worktree of the demo repo.

Done when: Goose reads a plan, edits the demo repo, runs tests, asks one question through `ask_human`, and finishes with a passing test run. Record the gateway auth result.

### Phase 1. Make the UI honest (can run alongside Phase 0)

- Hide Ideas, Metrics and Audit from the navigation and the Overview until Phase 7. Keep the routes. (Today Ideas and Metrics sit in the dock; Audit is linked from Metrics only.)
- Wire every action bar button to a server action (`src/app/actions/workstream.ts`): `revisePlan`, `requestReview`, `approvePlan`, `handOff`. Each one checks role and stage, writes an `AuditLog` row and revalidates. They can enqueue jobs that are no-ops until later phases.
- Move stage rules into one state machine in `packages/core/src/domain.ts` (`canTransition(from, to, role)`), with tests. The action bar reads from it so the buttons and the server agree.
- Pass the real running-agent count to the header pill.
- Make "Needs you" option buttons call `answerQuestion(questionId, option)` and remove the card on success.
- Apply the layout and material changes in section 4.

### Phase 2. MCP layer

- Add `packages/mcp` with an MCP client (`@modelcontextprotocol/sdk`) that loads `mcp-servers.yaml`.
- Mark each server and tool as `read` or `write` in that file. Scout and knowledge search only get `read` tools.
- Rewrite `packages/connectors` as a thin adapter over MCP: `search` and `get` call the relevant MCP tools. Keep the mock corpus for mock mode.
- Knowledge page: add "Add to workstream" on each result. It saves the item as a source on the workstream's latest research run.
- Audit every tool call (server, tool, workstream, user).

### Phase 3. Scout and Planner

- Worker: add BullMQ queues `research`, `plan`, `runner` in `apps/worker`.
- Scout job: run the Goose `scout` recipe with read-only MCP servers and the Relay MCP server. Store `report_progress` calls as `AgentEvent` rows and `record_finding` calls as findings with sources.
- Planner job: one gateway call with the findings, the problem statement and the repo file tree. Ask for JSON matching `PlanStep` (title, description, files, tests, risk). Validate with zod and save as a new `Plan` version.
- Live activity: an SSE route `src/app/api/workstreams/[id]/events/route.ts` that streams new `AgentEvent` rows. The Activity tab subscribes to it.
- Starting work: a problem typed on the Overview creates the workstream and enqueues Scout straight away.

### Phase 4. Review and approval

- Comments: create, reply, resolve, anchored to plan steps (the schema already supports this).
- "Revise plan using comments" enqueues a Planner job with the open comments and produces the next plan version.
- Approval: architect or lead only, all comments resolved. Writes `Approval` and `AuditLog`.
- Notify the plan owner and reviewers (start with an in-app badge; add Teams or email later).

### Phase 5. Runner

- Each Runner job gets a fresh Docker container, a git worktree on a new branch, and the approved plan plus any extra instructions.
- It runs the Goose `runner` recipe with the Relay MCP server, GitHub MCP (for the PR only) and no data-source MCP servers. No production data.
- Guardrails from `.env`: `TOKEN_BUDGET_PER_JOB` and `JOB_TIMEOUT_MS`. Stop and mark the job `failed` with a reason when either is hit.
- `ask_human` moves the workstream to `awaiting_input` and shows the card in Needs you. Answering resumes the job.
- On finish: open a PR (sandbox org until approved), store `prUrl`, move to `pr_open`, mark plan steps complete as the agent reports them.

### Phase 6. Jira sync

- On workstream creation: create a Jira issue through the Atlassian MCP server, or link an existing key.
- On stage change: transition the issue and add a comment with the plan link or PR link.
- One-way (Relay to Jira) to start. Do not import Jira edits back yet.

### Phase 7. Ideas, Metrics, Audit

- Ideas: inline capture from the Overview (saved with no page change), with optional "times per week" and "minutes lost each time". List sorted by hours lost per week. "Promote to workstream" button.
- Metrics: time in each stage per workstream, cycle time from start to merge, agent time against waiting-on-human time, tokens per workstream.
- Audit: a filterable table of `AuditLog`.

### Phase 8. Hardening

- Playwright happy path: start research, findings appear, plan generated, comment, revise, approve, hand off, answer a question, PR opened.
- SSO when SS&C confirms the identity provider. Remove the user switcher outside mock mode.
- Error states for gateway failure, MCP server down, sandbox failure.

## 4. Material and layout changes

The current look puts four layers of glass and moving background over the content: a fixed header, a floating dock, a sticky action bar, and drifting blobs with rotating polyhedra. It looks good in a screenshot but makes status harder to read and splits attention. The aim is to keep the premium feel on the frame and make the content plain and solid.

### Material rules

1. **Glass only on the top bar and the command palette.** Everything that holds content (lists, plans, cards, tables) sits on solid sheets with no blur behind text.
2. **Background is still.** Remove the drifting blobs and rotating wireframes from working pages. Keep one static, faint brand gradient behind the top bar, or use the wireframe art only on empty states. If you want to keep the motion, put it behind a setting that is off by default.
3. **Contrast.** Body and muted text at least 4.5:1 against the sheet colour in both themes. Check `--relay-ink-muted` on `--relay-sheet` first.
4. **Colour means one thing.** Blue: an agent is running, or a link. Amber: needs you. Green: done. Red: failed. Grey: idle. No other accent colours.
5. **One primary button per screen.** Everything else is a secondary or text button.
6. **Three text sizes.** Page title 28px, section heading 17px, body 14px. Meta lines 12.5px. IDs and paths in Geist Mono.

### Layout rules

1. **One navigation bar at the top.** Replace the bottom dock with top tabs: Overview, Workstreams, Knowledge (Ideas once it works). That removes one floating layer and puts navigation where people look first.
2. **One action area per page.** On the workstream page, the next step sits at the top in a "Next step" panel, not in a floating bar at the bottom.
3. **Show stage once, in five steps.** Research, Plan, Review, Build, PR. The ten internal stages map onto these five.
4. **Merge Overview timelines and the Workstreams page.** Both show the same list. Use one table (below) on both, with the Workstreams page adding filters.

### Overview

```
+--------------------------------------------------------------------------+
| Relay   Overview  Workstreams  Knowledge            Search (Ctrl K)  MC  |
+--------------------------------------------------------------------------+
| Overview                                                                 |
| 2 need you · 3 agents running · 3 merged this week                       |
|                                                                          |
| [ Describe a problem to research...                     ] [Start research]|
|   Log as idea · Search knowledge                                         |
|                                                                          |
| Research 2 | Plan 1 | Review 1 | Build 3 | PR 1 | Merged this week 3     |
|                                                                          |
| NEEDS YOU                               | AGENTS RUNNING                 |
| INNO-201 · Runner paused at step 2 of 6 | Runner · INNO-188 · step 3/6   |
| Which source is authoritative for       | Runner · INNO-193 · step 5/7   |
| launch dates?                           | Scout  · INNO-220 · 7 sources  |
| [Notices feed] [Salesforce] [Write...]  |                                |
|                                                                          |
| INNO-214 · Plan v2 · 3 open comments    |                                |
| [Review plan]                           |                                |
|                                                                          |
| WORKSTREAMS                          Owner: everyone   Sort: updated     |
| Title            Owner  Research Plan Review Build PR     Updated        |
| Fund Launch...   MC     ====================o paused      12 min         |
| Automate triage  OB     ====================> step 3/6    now            |
+--------------------------------------------------------------------------+
```

- One input with one primary action. "Log as idea" and "Search knowledge" reuse the same text. This replaces the three mode chips that change the placeholder and button.
- The stage counts are filters: clicking "Build 3" filters the table.
- Needs you on the left because it is the most important; agents running on the right.
- The table's columns are the five stages, so the bar shows where each workstream is. The reference design in `docs/screenshots/reference-overview.png` already does this well; follow it.

### Workstream page

```
+--------------------------------------------------------------------------+
| < Workstreams                                                            |
| Add ISIN validation tool to the Calastone MCP server                     |
| INNO-214 · Maya Chen · Plan v2                                           |
| (Research done) - (Plan done) - (Review now) - (Build) - (PR)            |
|                                                                          |
| NEXT STEP                                                                |
| 3 comments must be resolved before an architect can approve.             |
|                                     [Revise plan using comments]          |
|                                                                          |
| Research | Plan | Build | Activity                                       |
| ------------------------------------------------------------------------ |
| Plan v2                                     | Comments (3 open)          |
| Goal ...                                    | Aisha · Step 2             |
| 1. Extract ISIN validator   Low risk        | "structured error codes"   |
| 2. Register MCP tool        Medium risk     | Please list the exact...   |
+--------------------------------------------------------------------------+
```

- The "Next step" panel says in one sentence what is blocking progress and who it is waiting for, with the single primary action. Other actions go in a "More" menu.
- Tabs replace the three columns:
  - **Research:** findings with their sources, each linking to the Confluence page, Jira issue or file it came from.
  - **Plan:** the plan with anchored comments beside it, and a version switcher.
  - **Build:** Runner progress by plan step, questions asked and answered, PR link, test result.
  - **Activity:** agent events and audit entries in time order.
- Empty states say what happens next ("Scout is reading 6 sources. Findings appear here.").

### Copy

- Use the same five stage names everywhere.
- Status lines answer "what is happening and who is it waiting for": "Runner paused, waiting on you", "Plan in review, 3 comments open", "Scout researching, 7 sources read".
- No placeholder text that promises features that are not built.

## 5. Working with Cursor

- Add `.cursor/rules/relay.mdc` that copies the hard rules from `CLAUDE.md` (gateway only, mock by default, no production data in Runner, no em dashes) so every Cursor agent sees them.
- Update `DESIGN.md` with section 4 before starting the redesign, so Cursor's UI changes follow it.
- Work one phase per branch. Start each Cursor task with: "Read docs/plan/RELAY_PLAN.md, section X. Implement only that. Run `pnpm test` and keep mock mode working."
- After each phase, update the "Current state" table in this file.

### Starter prompts

Phase 1, actions:
> Read docs/plan/RELAY_PLAN.md Phase 1. Create a stage state machine in packages/core/src/domain.ts with canTransition(from, to, role) and tests. Add server actions in src/app/actions/workstream.ts for revisePlan, requestReview, approvePlan and handOff that use it, write an AuditLog row, and revalidate. Wire src/components/action-bar.tsx to them. Keep demo fixtures working when there is no database.

Phase 1, layout:
> Read docs/plan/RELAY_PLAN.md section 4 and DESIGN.md. Replace the bottom DockNav with top navigation tabs in the header (Overview, Workstreams, Knowledge). Remove Atmosphere and CalastoneWireframes from the root layout. Make content sheets opaque. Do not change data loading.

Phase 0, spike:
> Read docs/plan/RELAY_PLAN.md Phase 0. Add docker/Dockerfile.runner with the Goose CLI, a packages/relay-mcp stdio MCP server exposing ask_human, and recipes/runner.yaml. Add a script scripts/spike-runner.sh that creates a git worktree of demo-repos/sample-service and runs Goose with the plan file. Read gateway settings from .env. Do not call any model provider directly.

## 6. Measures

| Measure | Target for the first pilot |
| --- | --- |
| Time from problem logged to first plan | Same day |
| Time a plan waits for review | Under 24 hours |
| Workstreams in flight per engineer | 3 to 7 |
| Runner jobs finishing with tests passing | Track from the first job; set a target after 20 jobs |
| Questions per Runner job | Track; a falling number means plans are getting better |
