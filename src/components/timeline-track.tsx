import { cn } from "@/lib/utils";
import type { WorkstreamStage } from "@relay/core";

export type TimelineSegKind = "p" | "a" | "w";

export type TimelineSeg = {
  kind: TimelineSegKind;
  grow: number;
  tip: string;
  live?: boolean;
};

const STAGE_SEGS: Record<
  WorkstreamStage,
  { kinds: TimelineSegKind[]; grows: number[]; tips: string[] }
> = {
  idea: {
    kinds: ["p"],
    grows: [1],
    tips: ["Person working: idea captured"],
  },
  research: {
    kinds: ["p", "a"],
    grows: [0.4, 1.2],
    tips: ["Person working: problem written", "Agent running: Scout research"],
  },
  planning: {
    kinds: ["p", "a", "a"],
    grows: [0.4, 0.8, 0.6],
    tips: [
      "Person working: problem written",
      "Agent running: research",
      "Agent running: drafting plan",
    ],
  },
  in_review: {
    kinds: ["p", "a", "a", "w"],
    grows: [0.4, 0.7, 0.5, 1.2],
    tips: [
      "Person working: problem written",
      "Agent running: research",
      "Agent running: plan drafted",
      "Waiting on a person: review",
    ],
  },
  approved: {
    kinds: ["p", "a", "a", "w", "p"],
    grows: [0.4, 0.6, 0.5, 0.8, 0.3],
    tips: [
      "Person working: problem written",
      "Agent running: research",
      "Agent running: plan drafted",
      "Waiting on a person: review",
      "Person working: approved",
    ],
  },
  building: {
    kinds: ["p", "a", "a", "w", "p", "a"],
    grows: [0.3, 0.5, 0.4, 0.7, 0.2, 1],
    tips: [
      "Person working: problem written",
      "Agent running: research",
      "Agent running: plan drafted",
      "Waiting on a person: review",
      "Person working: handed off",
      "Agent running: Runner building",
    ],
  },
  awaiting_input: {
    kinds: ["p", "a", "a", "w", "p", "a", "w"],
    grows: [0.3, 0.5, 0.4, 0.6, 0.2, 0.8, 1],
    tips: [
      "Person working: problem written",
      "Agent running: research",
      "Agent running: plan drafted",
      "Waiting on a person: review",
      "Person working: handed off",
      "Agent running: Runner building",
      "Waiting on a person: Runner question",
    ],
  },
  pr_open: {
    kinds: ["p", "a", "a", "w", "p", "a", "w"],
    grows: [0.3, 0.4, 0.4, 0.5, 0.2, 1.2, 0.8],
    tips: [
      "Person working: problem written",
      "Agent running: research",
      "Agent running: plan drafted",
      "Waiting on a person: review",
      "Person working: handed off",
      "Agent running: build complete",
      "Waiting on a person: PR review",
    ],
  },
  merged: {
    kinds: ["p", "a", "a", "w", "p", "a", "w", "p"],
    grows: [0.3, 0.4, 0.3, 0.4, 0.2, 1, 0.5, 0.2],
    tips: [
      "Person working: problem written",
      "Agent running: research",
      "Agent running: plan drafted",
      "Waiting on a person: review",
      "Person working: handed off",
      "Agent running: build",
      "Waiting on a person: PR review",
      "Person working: merged",
    ],
  },
  killed: {
    kinds: ["p", "w"],
    grows: [0.5, 1],
    tips: ["Person working: started", "Waiting on a person: stopped"],
  },
};

export function segsForStage(
  stage: WorkstreamStage,
  progressTone?: "active" | "waiting" | "done" | "neutral",
): TimelineSeg[] {
  const def = STAGE_SEGS[stage] ?? STAGE_SEGS.idea;
  return def.kinds.map((kind, i) => {
    const live =
      progressTone === "active" &&
      kind === "a" &&
      i === def.kinds.length - 1 &&
      (stage === "building" || stage === "research" || stage === "planning");
    return {
      kind,
      grow: def.grows[i] ?? 1,
      tip: def.tips[i] ?? "",
      live,
    };
  });
}

export function statusToneClass(
  tone: "active" | "waiting" | "done" | "neutral" | TimelineSegKind | "d",
): string {
  if (tone === "active" || tone === "a") return "text-[var(--relay-brand-fg)]";
  if (tone === "waiting" || tone === "w") return "text-[var(--relay-warning)]";
  if (tone === "done" || tone === "d") return "text-[var(--relay-success)]";
  if (tone === "p") return "text-[var(--relay-ink-body)]";
  return "text-[var(--relay-ink-muted)]";
}

export function TimelineTrack(props: {
  segs: TimelineSeg[];
  ariaLabel: string;
  large?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex min-w-0 gap-[3px]",
        props.large ? "h-[30px] w-full gap-1" : "h-3.5 flex-[2_1_320px]",
        props.className,
      )}
      role="img"
      aria-label={props.ariaLabel}
    >
      {props.segs.map((seg, i) => (
        <span
          key={`${seg.kind}-${i}`}
          title={seg.tip}
          className={cn(
            "rl-seg",
            seg.kind === "p" && "rl-seg-p",
            seg.kind === "a" && "rl-seg-a",
            seg.kind === "w" && "rl-seg-w",
            seg.live && "rl-seg-live",
          )}
          style={{ flexGrow: seg.grow }}
        />
      ))}
    </span>
  );
}

export function TimelineLegend() {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-4 p-0 text-[13px] text-[var(--relay-ink-body)]">
      <li className="flex items-center gap-2">
        <span className="rl-seg rl-seg-p inline-block h-2.5 w-[22px]" />
        Person working
      </li>
      <li className="flex items-center gap-2">
        <span className="rl-seg rl-seg-a inline-block h-2.5 w-[22px]" />
        Agent running
      </li>
      <li className="flex items-center gap-2">
        <span className="rl-seg rl-seg-w inline-block h-2.5 w-[22px]" />
        Waiting on a person
      </li>
    </ul>
  );
}
