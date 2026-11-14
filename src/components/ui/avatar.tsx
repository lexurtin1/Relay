import { cn } from "@/lib/utils";

export function Avatar(props: {
  initials: string;
  name: string;
  className?: string;
}) {
  return (
    <span
      title={props.name}
      aria-label={props.name}
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--relay-surface-sunken)] text-[10px] font-semibold tracking-wide text-[var(--relay-ink-muted)]",
        props.className,
      )}
    >
      {props.initials}
    </span>
  );
}
