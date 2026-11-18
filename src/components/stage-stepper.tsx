import { STEPPER_STAGES, stepperIndex, type WorkstreamStage } from "@relay/core/domain";
import { cn } from "@/lib/utils";

const labels: Record<(typeof STEPPER_STAGES)[number], string> = {
  research: "Research",
  plan: "Plan",
  review: "Review",
  build: "Build",
  pr: "Pull request",
};

export function StageStepper(props: { stage: WorkstreamStage }) {
  const current = stepperIndex(props.stage);

  return (
    <ol className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Stage">
      {STEPPER_STAGES.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={step}
            className={cn(
              "flex items-center gap-2 rounded-full border border-[var(--relay-border)] px-3.5 py-1.5 pl-1.5 text-sm text-[var(--relay-ink-muted)]",
              done && "border-[var(--relay-border-strong)] text-[var(--relay-ink-body)]",
              active &&
                "border-[var(--relay-primary)] bg-[var(--relay-primary)] font-medium text-[var(--relay-primary-fg)]",
            )}
            aria-current={active ? "step" : undefined}
          >
            <span
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--relay-ink)_8%,transparent)] text-xs",
                done && "bg-[var(--relay-accent)] text-white",
                active && "bg-[var(--relay-primary-fg)] text-[var(--relay-primary)]",
              )}
            >
              {index + 1}
            </span>
            {labels[step]}
            <span className="sr-only">
              {done ? ", done" : active ? ", current" : ", not started"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
