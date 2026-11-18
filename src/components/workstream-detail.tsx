"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Bot, Loader2 } from "lucide-react";
import type { WorkstreamStage } from "@relay/core/domain";
import { ActionBar, applicableVerbs, planActionStatus } from "@/components/action-bar";
import { ColourDot } from "@/components/colour-dot";
import { CommentsRail, type CommentDraftTarget } from "@/components/comments-rail";
import { HandOffModal } from "@/components/hand-off-modal";
import { PlanDocument } from "@/components/plan-document";
import { ResearchActivity } from "@/components/research-activity";
import { RunnerConsole } from "@/components/runner-console";
import { StageStepper } from "@/components/stage-stepper";
import { segsForStage, statusToneClass, TimelineTrack } from "@/components/timeline-track";
import { Avatar, Badge, EmptyState, Tab, TabList } from "@/components/ui/astryx";
import { useRelayActions } from "@/lib/demo-store/provider";
import type { ActionVerb, WorkstreamDetailModel } from "@/lib/view-models";
import { cn, formatRelativeTime } from "@/lib/utils";

type TabKey = "research" | "plan" | "build" | "activity";

function tabForStage(stage: WorkstreamStage): TabKey {
  if (stage === "idea" || stage === "research") return "research";
  if (stage === "planning" || stage === "in_review" || stage === "approved") return "plan";
  if (stage === "building" || stage === "awaiting_input" || stage === "pr_open" || stage === "merged") return "build";
  return "activity";
}

const PRIMARY_LABEL: Record<ActionVerb, string> = {
  start_research: "Start research",
  generate_plan: "Generate plan",
  request_review: "Request review",
  revise_plan: "Revise from comments",
  approve_plan: "Approve plan",
  hand_off: "Hand off to Runner",
  answer_question: "Answer the Runner",
  merge_pr: "Merge pull request",
};

export function WorkstreamDetail(props: { model: WorkstreamDetailModel }) {
  const m = props.model;
  const actions = useRelayActions();
  const [tab, setTab] = useState<TabKey>(() => tabForStage(m.stage));
  const [handOffOpen, setHandOffOpen] = useState(false);
  const [target, setTarget] = useState<CommentDraftTarget>(null);
  const [hover, setHover] = useState<string | null>(null);
  const lastStage = useRef(m.stage);

  // When the stage changes, open the tab for the new stage.
  useEffect(() => {
    if (lastStage.current !== m.stage) {
      lastStage.current = m.stage;
      setTab(tabForStage(m.stage));
    }
  }, [m.stage]);

  const run = (verb: ActionVerb) => {
    switch (verb) {
      case "start_research":
        setTab("research");
        return actions.startResearch(m.id);
      case "generate_plan":
        setTab("plan");
        return void actions.generatePlan(m.id);
      case "request_review":
        return actions.requestReview(m.id);
      case "revise_plan":
        setTab("plan");
        return void actions.revisePlan(m.id);
      case "approve_plan":
        return actions.approvePlan(m.id);
      case "hand_off":
        return setHandOffOpen(true);
      case "answer_question":
        setTab("build");
        requestAnimationFrame(() => document.getElementById("runner-q")?.scrollIntoView({ behavior: "smooth", block: "center" }));
        return;
      case "merge_pr":
        return actions.mergePr(m.id);
    }
  };

  const segs = segsForStage(m.stage, m.progress.tone);
  const tone = m.progress.tone === "waiting" ? "w" : m.progress.tone === "done" ? "d" : m.progress.tone === "active" ? "a" : "p";
  const verbs = applicableVerbs(m.plan, Boolean(m.runner), m.research.status === "succeeded", Boolean(m.planDrafting));
  const primary = m.nextMove.primary;
  const primaryGate = primary ? m.gates[primary] : null;
  const commentTarget = m.gates.comment.ok ? (t: { anchorText: string | null; stepId: string | null }) => setTarget(t) : undefined;

  return (
    <div className="flex flex-col gap-5 pb-6">
      <Link
        href="/workstreams"
        className="inline-flex w-fit items-center gap-1.5 rounded-[10px] px-2 py-1.5 text-sm text-[var(--relay-ink-muted)] no-underline transition-relay hover:bg-[color-mix(in_srgb,var(--relay-ink)_6%,transparent)] hover:text-[var(--relay-ink)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All workstreams
      </Link>

      <section className="rl-hero grid gap-6 p-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]" aria-labelledby="ws-title">
        <div className="flex min-w-0 flex-col gap-3">
          <p className="m-0 text-[13px] text-[var(--relay-ink-muted)]">
            <span className="font-mono">{m.jiraKey ?? m.id.slice(0, 8)}</span>
            {" · "}
            <span className="capitalize">{m.priority}</span> priority
            {" · "}
            <span className="capitalize">{m.origin.replaceAll("_", " ")}</span>
            {" · Owner "}
            {m.owner.name}
          </p>
          <div className="flex items-start gap-3">
            <ColourDot color={m.color} pulse={m.progress.tone === "waiting"} size="md" className="mt-3" label={m.progress.tone === "waiting" ? "Needs a decision" : undefined} />
            <h1 id="ws-title" className="m-0 text-[clamp(26px,3vw,38px)] font-medium leading-[1.12] tracking-[-0.03em] text-[var(--relay-ink)]">
              {m.title}
            </h1>
          </div>
          <p className="m-0 max-w-[70ch] text-[14.5px] leading-relaxed text-[var(--relay-ink-body)]">{m.problemStatement}</p>
          <div className="mt-1 flex flex-col gap-3">
            <StageStepper stage={m.stage} />
            <div className="flex flex-wrap items-center gap-3">
              <TimelineTrack segs={segs} ariaLabel={`${m.title} timeline`} className="h-3 min-w-[200px] flex-1" />
              <span className={cn("text-[13px] font-medium", statusToneClass(tone))}>{m.progress.label}</span>
            </div>
          </div>
        </div>

        <aside
          className="flex flex-col gap-3 rounded-[18px] border border-[var(--relay-border)] bg-[var(--relay-surface)] p-5 shadow-[var(--relay-sheet-shadow)]"
          aria-labelledby="next-move-h"
        >
          <p className="rl-eyebrow">Next step</p>
          <div className="flex items-center gap-3">
            {m.nextMove.holder.kind === "agent" ? (
              <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--relay-brand-soft)] text-[var(--relay-brand-fg)]">
                <Bot className="h-5 w-5" aria-hidden />
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[var(--relay-surface)] bg-[var(--relay-live)] animate-relay-pulse" aria-hidden />
              </span>
            ) : (
              <Avatar name={m.nextMove.holder.name} size="lg" tooltip={false} />
            )}
            <div className="min-w-0">
              <p className="m-0 text-[14px] font-medium text-[var(--relay-ink)]">{m.nextMove.holder.name}</p>
              <p className="m-0 text-[12px] text-[var(--relay-ink-muted)]">
                {m.nextMove.holder.kind === "agent" ? `Agent · ${m.nextMove.holder.detail}` : m.nextMove.holder.detail}
              </p>
            </div>
          </div>
          <h2 id="next-move-h" className="m-0 text-[18px] font-medium tracking-[-0.02em] text-[var(--relay-ink)]">
            {m.nextMove.headline}
          </h2>
          <p className="m-0 text-[13.5px] text-[var(--relay-ink-body)]">{m.nextMove.body}</p>
          {primary && primaryGate ? (
            <div className="flex flex-col gap-1.5">
              <button type="button" className="rl-btn-primary self-start" disabled={!primaryGate.ok} onClick={() => run(primary)}>
                {PRIMARY_LABEL[primary]}
              </button>
              {!primaryGate.ok ? (
                <p className="m-0 text-[12.5px] text-[var(--relay-ink-muted)]">
                  {primaryGate.reason}
                  {primaryGate.switchTo && actions.mode === "demo" ? (
                    <button
                      type="button"
                      className="ml-1.5 font-medium text-[var(--relay-brand-fg)] hover:underline"
                      onClick={() => actions.switchUser(primaryGate.switchTo!.id)}
                    >
                      Switch to {primaryGate.switchTo.name}
                    </button>
                  ) : null}
                </p>
              ) : null}
            </div>
          ) : m.nextMove.holder.kind === "agent" ? (
            <p className="m-0 inline-flex items-center gap-1.5 text-[12.5px] text-[var(--relay-brand-fg)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
              No action needed. This updates automatically.
            </p>
          ) : null}
        </aside>
      </section>

      <div className="flex flex-col gap-4">
        <TabList value={tab} onChange={(v) => setTab(v as TabKey)} role="tablist" hasDivider>
          <Tab value="research" label="Research" panelId="panel-research" endContent={m.research.status === "running" ? <Badge variant="info" label="Live" /> : undefined} />
          <Tab
            value="plan"
            label="Plan"
            panelId="panel-plan"
            endContent={
              m.plan && m.plan.openComments > 0 ? (
                <Badge variant="warning" label={String(m.plan.openComments)} />
              ) : m.plan ? (
                <Badge label={`v${m.plan.version}`} />
              ) : undefined
            }
          />
          <Tab
            value="build"
            label="Build"
            panelId="panel-build"
            endContent={m.runner?.question && !m.runner.question.answer ? <Badge variant="warning" label="Needs you" /> : undefined}
          />
          <Tab value="activity" label="Activity" panelId="panel-activity" />
        </TabList>

        <div id="panel-research" role="tabpanel" hidden={tab !== "research"}>
          {tab === "research" ? (
            <ResearchActivity
              workstreamId={m.id}
              userAsk={m.research.ask}
              steps={m.research.steps}
              liveToolsLine={m.research.liveTools}
              color={m.color}
              status={m.research.status}
              findings={m.research.findings}
              sources={m.research.sources}
              askGate={m.gates.ask}
              startGate={m.stage === "idea" ? m.gates.start_research : undefined}
            />
          ) : null}
        </div>

        <div id="panel-plan" role="tabpanel" hidden={tab !== "plan"}>
          {tab === "plan" ? (
            m.planDrafting ? (
              <PlanSkeleton kind={m.planDrafting} />
            ) : m.plan ? (
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
                <section className="rl-sheet flex flex-col gap-4 p-6" aria-labelledby="plan-heading">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h2 id="plan-heading" className="m-0 text-[18px] font-medium text-[var(--relay-ink)]">
                        Plan v{m.plan.version}
                      </h2>
                      <Badge
                        variant={m.plan.status === "approved" ? "success" : m.plan.status === "in_review" ? "warning" : "neutral"}
                        label={m.plan.status === "in_review" ? "In review" : m.plan.status === "approved" ? "Approved" : "Draft"}
                      />
                    </div>
                    <p className="m-0 text-[12.5px] text-[var(--relay-ink-muted)]">
                      {m.plan.totalVersions > 1 ? `${m.plan.totalVersions} versions` : "First version"}
                      {m.plan.approvals.length ? ` · Approved by ${m.plan.approvals.map((a) => a.name).join(", ")}` : ""}
                    </p>
                  </div>
                  <PlanDocument
                    markdown={m.plan.markdown}
                    steps={m.plan.steps}
                    comments={m.plan.comments}
                    highlightedCommentId={hover}
                    onHoverAnchor={setHover}
                    onCommentTarget={commentTarget}
                  />
                </section>
                <CommentsRail
                  comments={m.plan.comments}
                  commentGate={m.gates.comment}
                  resolveGate={m.gates.resolve}
                  target={target}
                  onClearTarget={() => setTarget(null)}
                  onAdd={(input) => actions.addComment({ wsId: m.id, ...input })}
                  onResolve={(id) => actions.resolveComment(m.id, id)}
                  highlightedId={hover}
                  onHover={setHover}
                />
              </div>
            ) : (
              <div className="rl-sheet p-6">
                <EmptyState
                  title="No plan yet"
                  description={
                    m.research.status === "succeeded"
                      ? "Scout's findings are ready. The Planner turns them into ordered, testable steps."
                      : "The Planner needs Scout's findings first."
                  }
                  actions={
                    <button
                      type="button"
                      className="rl-btn-primary rl-btn-compact"
                      disabled={!m.gates.generate_plan.ok}
                      title={m.gates.generate_plan.reason}
                      onClick={() => run("generate_plan")}
                    >
                      Generate plan
                    </button>
                  }
                />
              </div>
            )
          ) : null}
        </div>

        <div id="panel-build" role="tabpanel" hidden={tab !== "build"}>
          {tab === "build" ? (
            <RunnerConsole
              runner={m.runner}
              steps={m.plan?.steps ?? []}
              color={m.color}
              answerGate={m.gates.answer_question}
              mergeGate={m.gates.merge_pr}
              handOffGate={m.gates.hand_off}
              onAnswer={(a) => actions.answerQuestion(m.id, a)}
              onMerge={() => actions.mergePr(m.id)}
              onHandOff={() => setHandOffOpen(true)}
            />
          ) : null}
        </div>

        <div id="panel-activity" role="tabpanel" hidden={tab !== "activity"}>
          {tab === "activity" ? <ActivityPanel model={m} /> : null}
        </div>
      </div>

      {m.interactive ? (
        <ActionBar
          verbs={verbs}
          gates={m.gates}
          status={planActionStatus(m.plan, Boolean(m.planDrafting))}
          primary={primary}
          onRun={run}
          onSwitch={(id) => actions.switchUser(id)}
          color={m.color}
        />
      ) : null}

      <HandOffModal
        open={handOffOpen}
        onOpenChange={setHandOffOpen}
        workstreamId={m.id}
        planId={m.plan?.id ?? null}
        planVersion={m.plan?.version ?? null}
        stepsTotal={m.plan?.steps.length ?? 0}
        color={m.color}
        onDone={() => setTab("build")}
      />
    </div>
  );
}

function PlanSkeleton(props: { kind: "generate" | "revise" }) {
  return (
    <section className="rl-sheet flex flex-col gap-4 p-6" aria-busy="true" aria-live="polite">
      <p className="m-0 inline-flex items-center gap-2 text-[14px] font-medium text-[var(--relay-brand-fg)]">
        <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
        {props.kind === "revise" ? "The Planner is revising the plan from review comments" : "The Planner is drafting the plan from Scout's findings"}
      </p>
      {[78, 92, 64, 85, 70].map((w, i) => (
        <div key={i} className="h-3.5 rounded-full bg-[var(--relay-surface-sunken)] animate-relay-pulse" style={{ width: `${w}%` }} />
      ))}
    </section>
  );
}

function ActivityPanel(props: { model: WorkstreamDetailModel }) {
  const m = props.model;
  const total = m.tokens.input + m.tokens.output;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)]">
      <section className="rl-sheet p-5" aria-labelledby="activity-h">
        <h2 id="activity-h" className="m-0 text-[16px] font-medium text-[var(--relay-ink)]">
          Activity history
        </h2>
        <p className="m-0 mt-1 text-[13px] text-[var(--relay-ink-muted)]">Agent and person actions, newest first. The same entries appear in Audit.</p>
        <ol className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
          {m.history.length === 0 ? <li className="text-sm text-[var(--relay-ink-muted)]">No activity yet.</li> : null}
          {m.history.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              <span
                className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: item.actor === "agent" ? "var(--relay-seg-agent)" : "var(--relay-seg-person)" }}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block text-[13.5px] text-[var(--relay-ink)]">{item.label}</span>
                <span className="text-[12px] text-[var(--relay-ink-muted)]" suppressHydrationWarning>
                  {item.actor === "agent" ? "Agent" : "Person"} · {formatRelativeTime(item.at)}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>
      <aside className="rl-sheet flex flex-col gap-3 p-5">
        <h3 className="m-0 text-[15px] font-medium text-[var(--relay-ink)]">Model use</h3>
        <p className="rl-stat-value m-0">{total.toLocaleString("en-GB")}</p>
        <p className="m-0 text-[12.5px] text-[var(--relay-ink-muted)]">
          tokens through the AI Gateway ({m.tokens.input.toLocaleString("en-GB")} in, {m.tokens.output.toLocaleString("en-GB")} out)
        </p>
        <Link href="/audit" className="text-[13px] font-medium">
          Open the audit log
        </Link>
      </aside>
    </div>
  );
}
