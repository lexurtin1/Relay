"use client";

import { useState, type FormEvent } from "react";
import { handOffToRunner } from "@/app/actions/ideas";
import { Dialog, DialogHeader } from "@/components/ui/astryx";
import { useRelayActions } from "@/lib/demo-store/provider";

const MODELS = [
  { id: "claude-opus-5-5", label: "Claude Opus" },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet" },
  { id: "gpt-5.6-sol", label: "GPT-5.6 Sol" },
];

const PROFILES = [
  { id: "default", label: "Default", hint: "Pauses once if a step changes shared behaviour" },
  { id: "careful", label: "Careful", hint: "Asks before every medium or high risk step" },
  { id: "fast", label: "Fast", hint: "Only pauses when blocked" },
];

/** Controlled hand-off dialog. The page decides when it opens. */
export function HandOffModal(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workstreamId: string;
  planId: string | null;
  planVersion: number | null;
  stepsTotal: number;
  color?: string;
  onDone?: () => void;
}) {
  const actions = useRelayActions();
  const [context, setContext] = useState("");
  const [model, setModel] = useState(MODELS[0]!.id);
  const [profile, setProfile] = useState(PROFILES[0]!.id);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (actions.mode === "demo") {
      if (actions.handOff(props.workstreamId, { model, profile, context })) {
        props.onOpenChange(false);
        setContext("");
        props.onDone?.();
      }
      return;
    }
    const fd = new FormData();
    fd.set("workstreamId", props.workstreamId);
    fd.set("planId", props.planId ?? "");
    fd.set("additionalContext", context);
    fd.set("modelId", model);
    fd.set("profile", profile);
    await handOffToRunner(fd);
    props.onOpenChange(false);
    props.onDone?.();
  };

  return (
    <Dialog isOpen={props.open} onOpenChange={props.onOpenChange} purpose="form" width={540}>
      <DialogHeader
        title="Hand off to the Runner"
        subtitle={`Plan v${props.planVersion ?? 1}, ${props.stepsTotal} steps. The Runner gets its own workspace with no production data.`}
        onOpenChange={props.onOpenChange}
      />
      <form onSubmit={submit} className="flex flex-col gap-4 p-5">
        <div>
          <label htmlFor="handoff-context" className="mb-1.5 block text-[13px] font-medium text-[var(--relay-ink)]">
            Extra context <span className="font-normal text-[var(--relay-ink-muted)]">(optional)</span>
          </label>
          <textarea
            id="handoff-context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="rl-input min-h-[96px] w-full py-3"
            placeholder="Anything the plan does not say, for example a test account to use"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="handoff-model" className="mb-1.5 block text-[13px] font-medium text-[var(--relay-ink)]">
              Model
            </label>
            <select id="handoff-model" value={model} onChange={(e) => setModel(e.target.value)} className="rl-input rl-input-compact w-full text-[13px]">
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <p className="m-0 mt-1 text-[11.5px] text-[var(--relay-ink-subtle)]">Every call goes through the SS&amp;C AI Gateway.</p>
          </div>
          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-1.5 text-[13px] font-medium text-[var(--relay-ink)]">Runner profile</legend>
            <div className="flex flex-col gap-1.5">
              {PROFILES.map((p) => (
                <label key={p.id} className="flex cursor-pointer items-start gap-2 text-[13px]">
                  <input type="radio" name="profile" value={p.id} checked={profile === p.id} onChange={() => setProfile(p.id)} className="mt-1" />
                  <span>
                    <span className="font-medium text-[var(--relay-ink)]">{p.label}</span>
                    <span className="block text-[11.5px] text-[var(--relay-ink-muted)]">{p.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--relay-border)] pt-4">
          <button type="button" className="rl-btn-second" onClick={() => props.onOpenChange(false)}>
            Cancel
          </button>
          <button
            type="submit"
            className="rl-btn-primary"
            style={props.color ? { background: props.color, borderColor: props.color } : undefined}
          >
            Hand off
          </button>
        </div>
      </form>
    </Dialog>
  );
}
