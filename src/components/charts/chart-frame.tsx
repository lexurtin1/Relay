import type { ReactNode } from "react";

/** Card, title and an always-available table view for one chart. */
export function ChartFrame(props: {
  title: string;
  subtitle: string;
  legend?: ReactNode;
  table: { head: string[]; rows: Array<Array<string | number>> };
  children: ReactNode;
}) {
  return (
    <section className="rl-sheet rl-sheet-elevated flex min-w-0 flex-col gap-4 p-5" aria-label={props.title}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-[15px] font-medium text-[var(--relay-ink)]">{props.title}</h2>
          <p className="m-0 mt-0.5 text-[12.5px] text-[var(--relay-ink-muted)]">{props.subtitle}</p>
        </div>
        {props.legend}
      </div>
      {props.children}
      <details className="text-[12.5px] text-[var(--relay-ink-muted)]">
        <summary className="cursor-pointer select-none hover:text-[var(--relay-ink)]">View as table</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-left text-[12.5px]">
            <thead>
              <tr>
                {props.table.head.map((h) => (
                  <th key={h} className="border-b border-[var(--relay-border)] py-1.5 pr-3 font-medium text-[var(--relay-ink)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {props.table.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j} className="tabular border-b border-[var(--relay-border)] py-1.5 pr-3 text-[var(--relay-ink-body)]">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

export function LegendItem(props: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--relay-ink-muted)]">
      <span className="inline-block h-2.5 w-2.5 rounded-[3px]" style={{ background: props.color }} aria-hidden />
      {props.label}
    </span>
  );
}
