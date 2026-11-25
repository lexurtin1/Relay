/** CI fix attempts. A third failure asks a person and stops. */
export const MAX_CI_FIX_ATTEMPTS = 2;

export type BlueprintNode =
  | "clone"
  | "install"
  | "plan"
  | "edit"
  | "lint"
  | "test"
  | "fix"
  | "ask"
  | "open_pr";

export type BlueprintKind = "fixed" | "agent";

export type BlueprintOutcome = "succeeded" | "awaiting_input" | "failed";

export interface BlueprintStep {
  node: BlueprintNode;
  kind: BlueprintKind;
  attempt?: number;
}

export interface BlueprintResult {
  steps: BlueprintStep[];
  outcome: BlueprintOutcome;
  fixAttempts: number;
  error?: string;
}

export interface CheckResult {
  ok: boolean;
  output: string;
}

export interface BlueprintHooks {
  clone: () => Promise<void>;
  install: () => Promise<void>;
  plan: () => Promise<string>;
  edit: (planNote: string) => Promise<void>;
  lint: () => Promise<CheckResult>;
  test: () => Promise<CheckResult>;
  fix: (attempt: number, failure: string) => Promise<void>;
  ask: (failure: string) => Promise<void>;
  openPullRequest: () => Promise<void>;
}

export function nextFixDecision(fixesAlreadyRun: number): "fix" | "ask" {
  if (fixesAlreadyRun >= MAX_CI_FIX_ATTEMPTS) return "ask";
  return "fix";
}

/** Throws when a caller tries to start a fix past the cap. */
export function assertFixAllowed(fixesAlreadyRun: number): void {
  if (nextFixDecision(fixesAlreadyRun) !== "fix") {
    throw new Error("CI fix cap is 2");
  }
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Fixed nodes and agent nodes for one Runner job.
 * Lint and test are the local CI pair. At most two fix loops follow a red pair.
 */
export async function runBlueprint(hooks: BlueprintHooks): Promise<BlueprintResult> {
  const steps: BlueprintStep[] = [];
  let fixAttempts = 0;

  const fixed = async (node: "clone" | "install", run: () => Promise<void>): Promise<BlueprintResult | null> => {
    try {
      await run();
      steps.push({ node, kind: "fixed" });
      return null;
    } catch (error) {
      return { steps, outcome: "failed", fixAttempts, error: message(error) };
    }
  };

  const cloneFailed = await fixed("clone", hooks.clone);
  if (cloneFailed) return cloneFailed;
  const installFailed = await fixed("install", hooks.install);
  if (installFailed) return installFailed;

  let planNote = "";
  try {
    planNote = await hooks.plan();
    steps.push({ node: "plan", kind: "agent" });
    await hooks.edit(planNote);
    steps.push({ node: "edit", kind: "agent" });
  } catch (error) {
    return { steps, outcome: "failed", fixAttempts, error: message(error) };
  }

  const check = async (): Promise<CheckResult> => {
    const lint = await hooks.lint();
    steps.push({ node: "lint", kind: "fixed" });
    if (!lint.ok) return lint;
    const test = await hooks.test();
    steps.push({ node: "test", kind: "fixed" });
    return test;
  };

  let result = await check();
  while (!result.ok) {
    const decision = nextFixDecision(fixAttempts);
    if (decision === "ask") {
      await hooks.ask(result.output);
      steps.push({ node: "ask", kind: "fixed" });
      return { steps, outcome: "awaiting_input", fixAttempts };
    }
    assertFixAllowed(fixAttempts);
    fixAttempts += 1;
    try {
      await hooks.fix(fixAttempts, result.output);
    } catch (error) {
      return { steps, outcome: "failed", fixAttempts, error: message(error) };
    }
    steps.push({ node: "fix", kind: "agent", attempt: fixAttempts });
    result = await check();
  }

  await hooks.openPullRequest();
  steps.push({ node: "open_pr", kind: "fixed" });
  return { steps, outcome: "succeeded", fixAttempts };
}
