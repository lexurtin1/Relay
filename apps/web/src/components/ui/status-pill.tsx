import { cn } from "@/lib/utils";
import { stageLabel, type WorkstreamStage } from "@relay/core";

const toneByStage: Record<
  WorkstreamStage,
  "neutral" | "live" | "warning" | "success" | "danger"
> = {
  idea: "neutral",
  research: "live",
  planning: "neutral",
  in_review: "warning",
  approved: "success",
  building: "live",
  awaiting_input: "warning",
  pr_open: "success",
  merged: "success",
  killed: "danger",
};

const toneClass = {
  neutral: "border-[var(--relay-border)] bg-[var(--relay-surface)] text-[var(--relay-ink-muted)]",
  live: "border-[color-mix(in_srgb,var(--relay-primary)_35%,white)] bg-[color-mix(in_srgb,var(--relay-primary)_8%,white)] text-[var(--relay-primary)]",
  warning:
    "border-[color-mix(in_srgb,var(--relay-warning)_35%,white)] bg-[var(--relay-warning-soft)] text-[var(--relay-warning)]",
  success:
    "border-[color-mix(in_srgb,var(--relay-success)_30%,white)] bg-[var(--relay-success-soft)] text-[var(--relay-success)]",
  danger:
    "border-[color-mix(in_srgb,var(--relay-danger)_30%,white)] bg-[var(--relay-danger-soft)] text-[var(--relay-danger)]",
} as const;

export function StatusPill(props: { stage: WorkstreamStage; className?: string }) {
  const tone = toneByStage[props.stage];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium capitalize",
        toneClass[tone],
        props.className,
      )}
    >
      {stageLabel(props.stage)}
    </span>
  );
}
