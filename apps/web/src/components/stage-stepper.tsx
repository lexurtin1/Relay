import { Check } from "lucide-react";
import { STEPPER_STAGES, stepperIndex, type WorkstreamStage } from "@relay/core";
import { cn } from "@/lib/utils";

const labels: Record<(typeof STEPPER_STAGES)[number], string> = {
  research: "Research",
  plan: "Plan",
  review: "Review",
  build: "Build",
  pr: "PR",
};

export function StageStepper(props: { stage: WorkstreamStage }) {
  const current = stepperIndex(props.stage);

  return (
    <ol className="flex flex-wrap items-center gap-1" aria-label="Workstream stage">
      {STEPPER_STAGES.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step} className="flex items-center gap-1">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-medium transition-relay",
                done &&
                  "border-[color-mix(in_srgb,var(--relay-success)_30%,white)] bg-[var(--relay-success-soft)] text-[var(--relay-success)]",
                active &&
                  "border-[color-mix(in_srgb,var(--relay-primary)_40%,white)] bg-[color-mix(in_srgb,var(--relay-primary)_10%,white)] text-[var(--relay-primary)]",
                !done &&
                  !active &&
                  "border-[var(--relay-border)] bg-[var(--relay-surface)] text-[var(--relay-ink-subtle)]",
              )}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
              {labels[step]}
            </span>
            {index < STEPPER_STAGES.length - 1 ? (
              <span className="mx-0.5 h-px w-4 bg-[var(--relay-border)]" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
