export function PlaceholderPage(props: { title: string; body: string }) {
  return (
    <div className="rounded border border-[var(--relay-border)] bg-[var(--relay-surface)] p-6">
      <h1 className="text-xl font-semibold text-[var(--relay-ink)]">{props.title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--relay-ink-muted)]">{props.body}</p>
    </div>
  );
}
