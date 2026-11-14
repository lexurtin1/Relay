import { Check } from "lucide-react";
import { STEPPER_STAGES, stepperIndex, type WorkstreamStage } from "@relay/core";
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
    <ol className="flex flex-wrap items-center gap-2" aria-label="Workstream stage">
      {STEPPER_STAGES.map((step, index) => {
        const done = index < current;
        const active = index === current;
        const locked = index > current;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-relay",
                done &&
                  "border-[color-mix(in_srgb,var(--relay-brand)_35%,white)] bg-[var(--relay-brand-soft)] text-[var(--relay-brand)]",
                active &&
                  "border-[color-mix(in_srgb,var(--relay-warning)_40%,white)] bg-[var(--relay-warning-soft)] text-[var(--relay-warning)]",
                locked &&
                  "border-[var(--relay-border)] bg-[var(--relay-surface)] text-[var(--relay-ink-subtle)]",
              )}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={cn(
                  "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                  done && "bg-[var(--relay-brand)] text-white",
                  active && "bg-[var(--relay-warning)] text-white",
                  locked && "bg-[var(--relay-surface-sunken)] text-[var(--relay-ink-subtle)]",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : index + 1}
              </span>
              {labels[step]}
            </span>
            {index < STEPPER_STAGES.length - 1 ? (
              <span className="hidden h-px w-6 bg-[var(--relay-border-strong)] sm:block" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
