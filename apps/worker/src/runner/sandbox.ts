import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import type { CredentialBroker } from "./broker";

export interface CommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

export interface DockerClient {
  create(opts: { name: string; image: string }): Promise<{ id: string }>;
  exec(id: string, argv: string[], env?: Record<string, string>): Promise<CommandResult>;
  remove(id: string): Promise<void>;
}

export interface JobWorkspace {
  kind: "fixture" | "docker";
  jobId: string;
  workspacePath: string;
  phases: string[];
  jobToken: string | null;
  run(command: string): Promise<CommandResult>;
  exec(argv: string[], env?: Record<string, string>): Promise<CommandResult>;
  create(): Promise<void>;
  clone(): Promise<void>;
  install(): Promise<void>;
  destroy(): Promise<void>;
}

export interface OpenWorkspaceOptions {
  jobId: string;
  mode: "mock" | "live";
  broker: CredentialBroker;
  root: string;
  docker?: DockerClient;
  image?: string;
  /** Preset command results for the fixture sandbox. Keyed by the full command line. */
  commands?: Record<string, { code: number; stdout?: string; stderr?: string }>;
  repoUrl?: string;
}

function preset(commands: OpenWorkspaceOptions["commands"], command: string): CommandResult | null {
  const hit = commands?.[command];
  if (!hit) return null;
  return { code: hit.code, stdout: hit.stdout ?? "", stderr: hit.stderr ?? "" };
}

class FixtureWorkspace implements JobWorkspace {
  kind = "fixture" as const;
  phases: string[] = [];
  jobToken: string | null = null;
  readonly workspacePath: string;
  private destroyed = false;

  constructor(
    readonly jobId: string,
    private readonly broker: CredentialBroker,
    root: string,
    private readonly commands: OpenWorkspaceOptions["commands"],
  ) {
    this.workspacePath = join(root, jobId);
  }

  async run(command: string): Promise<CommandResult> {
    return preset(this.commands, command) ?? { code: 0, stdout: "ok", stderr: "" };
  }

  async exec(argv: string[]): Promise<CommandResult> {
    return this.run(argv.join(" "));
  }

  async create(): Promise<void> {
    this.phases.push("create");
    this.jobToken = this.broker.issueJobToken(this.jobId);
    await mkdir(this.workspacePath, { recursive: true });
    await writeFile(
      join(this.workspacePath, "package.json"),
      JSON.stringify({ name: "relay-runner-job", private: true }, null, 2),
    );
  }

  async clone(): Promise<void> {
    this.phases.push("clone");
    const result = await this.run("git clone");
    if (result.code !== 0) {
      await this.destroy();
      throw new Error(result.stderr || "clone failed");
    }
  }

  async install(): Promise<void> {
    this.phases.push("install");
    const result = await this.run("pnpm install");
    if (result.code !== 0) {
      throw new Error(result.stderr || "install failed");
    }
  }

  async destroy(): Promise<void> {
    if (this.destroyed) return;
    this.destroyed = true;
    this.phases.push("destroy");
    this.broker.revokeJob(this.jobId);
    this.jobToken = null;
  }
}

class DockerWorkspace implements JobWorkspace {
  kind = "docker" as const;
  phases: string[] = [];
  jobToken: string | null = null;
  workspacePath = "/workspace";
  private containerId: string | null = null;
  private destroyed = false;

  constructor(
    readonly jobId: string,
    private readonly broker: CredentialBroker,
    private readonly docker: DockerClient,
    private readonly image: string,
    private readonly repoUrl: string,
  ) {}

  async run(command: string): Promise<CommandResult> {
    return this.exec(["sh", "-c", command]);
  }

  async exec(argv: string[], env?: Record<string, string>): Promise<CommandResult> {
    if (!this.containerId) throw new Error("Container is not running");
    return this.docker.exec(this.containerId, argv, env);
  }

  async create(): Promise<void> {
    this.phases.push("create");
    this.jobToken = this.broker.issueJobToken(this.jobId);
    const created = await this.docker.create({ name: `relay-job-${this.jobId}`, image: this.image });
    this.containerId = created.id;
  }

  async clone(): Promise<void> {
    this.phases.push("clone");
    try {
      const argv = this.repoUrl ? ["git", "clone", "--depth", "1", this.repoUrl, "."] : ["git", "init"];
      const result = await this.exec(argv);
      if (result.code !== 0) throw new Error(result.stderr || "clone failed");
    } catch (error) {
      await this.destroy();
      throw error;
    }
  }

  async install(): Promise<void> {
    this.phases.push("install");
    const result = await this.run("pnpm install");
    if (result.code !== 0) throw new Error(result.stderr || "install failed");
  }

  async destroy(): Promise<void> {
    if (this.destroyed) return;
    this.destroyed = true;
    this.phases.push("destroy");
    this.broker.revokeJob(this.jobId);
    this.jobToken = null;
    if (this.containerId) {
      const id = this.containerId;
      this.containerId = null;
      await this.docker.remove(id);
    }
  }
}

/**
 * Mock mode never touches Docker. Live mode opens one container per job.
 */
export async function openWorkspace(opts: OpenWorkspaceOptions): Promise<JobWorkspace> {
  if (opts.mode === "mock" || !opts.docker) {
    return new FixtureWorkspace(opts.jobId, opts.broker, opts.root, opts.commands);
  }
  return new DockerWorkspace(opts.jobId, opts.broker, opts.docker, opts.image ?? "relay-runner:local", opts.repoUrl ?? "");
}

function run(command: string, args: string[]): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      });
    });
  });
}

/** Docker CLI client used when RELAY_MODE=live. Tests inject a fake instead. */
export function createDockerCli(opts: { network?: string } = {}): DockerClient {
  return {
    async create({ name, image }) {
      const args = ["run", "-d", "--name", name, "--cap-drop", "ALL", "--security-opt", "no-new-privileges", "-w", "/workspace"];
      if (opts.network) args.push("--network", opts.network);
      else args.push("--add-host", "host.docker.internal:host-gateway");
      args.push(image, "sleep", "infinity");
      const result = await run("docker", args);
      if (result.code !== 0) throw new Error(result.stderr || "docker run failed");
      return { id: result.stdout.trim() || name };
    },
    async exec(id, argv, env) {
      const args = ["exec"];
      for (const [key, value] of Object.entries(env ?? {})) {
        if (key === "AI_GATEWAY_API_KEY" || key === "GITHUB_TOKEN") continue;
        args.push("-e", `${key}=${value}`);
      }
      args.push(id, ...argv);
      return run("docker", args);
    },
    async remove(id) {
      await run("docker", ["rm", "-f", id]);
    },
  };
}
