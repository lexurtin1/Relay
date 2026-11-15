import { formatRelativeTime } from "@/lib/utils";
import {
  Bot,
  FilePenLine,
  HelpCircle,
  MessageSquare,
  Play,
  Wrench,
} from "lucide-react";

export type ActivityEventView = {
  id: string;
  type: string;
  createdAt: string | Date;
  summary: string;
};

const iconFor = {
  thought_summary: Bot,
  tool_call: Wrench,
  tool_result: Wrench,
  file_edit: FilePenLine,
  test_run: Play,
  question: HelpCircle,
  answer: MessageSquare,
  status: Play,
} as const;

export function ActivityTimeline(props: { events: ActivityEventView[] }) {
  if (props.events.length === 0) {
    return (
      <div className="rl-sheet border-dashed p-4 text-sm text-[var(--relay-ink-muted)]">
        <p className="font-medium text-[var(--relay-ink)]">No agent activity yet</p>
        <p className="mt-1">
          Start research to see Scout&apos;s progress here. Tool calls stay collapsed until you
          expand them.
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-0 border-l border-[var(--relay-border)] pl-4">
      {props.events.map((event) => {
        const Icon =
          iconFor[event.type as keyof typeof iconFor] ?? Bot;
        return (
          <li key={event.id} className="relative pb-4 animate-relay-in">
            <span className="absolute -left-[21px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--relay-border)] bg-[var(--relay-surface)]">
              <Icon className="h-3 w-3 text-[var(--relay-ink-muted)]" aria-hidden />
            </span>
            <div className="text-[11px] uppercase tracking-wide text-[var(--relay-ink-subtle)]">
              {event.type.replaceAll("_", " ")} · {formatRelativeTime(event.createdAt)}
            </div>
            <p className="mt-1 text-sm text-[var(--relay-ink-muted)]">{event.summary}</p>
          </li>
        );
      })}
    </ol>
  );
}
