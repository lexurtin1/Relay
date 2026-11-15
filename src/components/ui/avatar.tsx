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
        "inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[var(--relay-seg-person)] text-[12px] font-semibold tracking-wide text-[#0D131F]",
        props.className,
      )}
    >
      {props.initials}
    </span>
  );
}
