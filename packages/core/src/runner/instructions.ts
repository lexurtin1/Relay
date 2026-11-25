import { config } from "../config";

export interface RunnerInstructions {
  model: string;
  profile: string;
  context: string;
}

/** Hand-off stores the chosen model and profile on the job as plain lines. */
export function parseRunnerInstructions(raw: string | null | undefined): RunnerInstructions {
  const lines = (raw ?? "").split("\n");
  let model = config.modelId;
  let profile = "default";
  const context: string[] = [];
  for (const line of lines) {
    if (line.startsWith("model:")) {
      model = line.slice("model:".length).trim() || model;
    } else if (line.startsWith("profile:")) {
      profile = line.slice("profile:".length).trim() || profile;
    } else if (line.trim()) {
      context.push(line);
    }
  }
  return { model, profile, context: context.join("\n") };
}
