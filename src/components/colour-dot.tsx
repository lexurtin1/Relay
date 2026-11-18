import { cn } from "@/lib/utils";

/** Workstream colour marker. Pulse when a human decision is waiting. */
export function ColourDot(props: {
  color: string;
  pulse?: boolean;
  size?: "sm" | "md";
  className?: string;
  label?: string;
}) {
  const dim = props.size === "md" ? "h-3 w-3" : "h-2.5 w-2.5";
  return (
    <span
      className={cn(
        "inline-block shrink-0 rounded-full",
        dim,
        props.pulse && "animate-relay-colour-pulse",
        props.className,
      )}
      style={{
        background: props.color,
        ["--relay-pulse-colour" as string]: props.color,
      }}
      role={props.label ? "img" : undefined}
      aria-label={props.label}
      aria-hidden={props.label ? undefined : true}
    />
  );
}
