import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createCredentialBroker } from "./broker";
import { openWorkspace, type DockerClient } from "./sandbox";

function fakeDocker(failClone = false): DockerClient & { created: string[]; removed: string[] } {
  const created: string[] = [];
  const removed: string[] = [];
  const live = new Set<string>();
  return {
    created,
    removed,
    async create({ name }) {
      if (live.has(name)) throw new Error(`container already exists: ${name}`);
      live.add(name);
      created.push(name);
      return { id: name };
    },
    async exec(_id, argv) {
      if (failClone && argv[0] === "git" && argv[1] === "clone") {
        throw new Error("clone failed");
      }
      return { code: 0, stdout: "", stderr: "" };
    },
    async remove(id) {
      live.delete(id);
      removed.push(id);
    },
  };
}

describe("sandbox", () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });

  it("opens one container per job and revokes the token on destroy", async () => {
    const docker = fakeDocker();
    const broker = createCredentialBroker();
    const first = await openWorkspace({
      jobId: "job-a",
      mode: "live",
      broker,
      root: "/unused",
      docker,
      repoUrl: "https://example.invalid/fixture.git",
    });
    const second = await openWorkspace({
      jobId: "job-b",
      mode: "live",
      broker,
      root: "/unused",
      docker,
      repoUrl: "https://example.invalid/fixture.git",
    });

    await first.create();
    await first.clone();
    await first.install();
    expect(first.phases).toEqual(["create", "clone", "install"]);
    expect(broker.hasJob("job-a")).toBe(true);
    expect(broker.issueGitToken("job-a", "https://example.invalid/fixture.git")).toBeTruthy();

    await second.create();
    expect(docker.created).toEqual(["relay-job-job-a", "relay-job-job-b"]);

    await first.destroy();
    expect(first.phases).toEqual(["create", "clone", "install", "destroy"]);
    expect(broker.hasJob("job-a")).toBe(false);
    expect(broker.gitToken("job-a", "https://example.invalid/fixture.git")).toBeNull();
    expect(docker.removed).toEqual(["relay-job-job-a"]);
    expect(broker.hasJob("job-b")).toBe(true);
    await second.destroy();
  });

  it("revokes the token when clone fails during boot", async () => {
    const docker = fakeDocker(true);
    const broker = createCredentialBroker();
    const workspace = await openWorkspace({
      jobId: "job-c",
      mode: "live",
      broker,
      root: "/unused",
      docker,
      repoUrl: "https://example.invalid/fixture.git",
    });
    await workspace.create();
    await expect(workspace.clone()).rejects.toThrow(/clone failed/);
    expect(broker.hasJob("job-c")).toBe(false);
    expect(docker.removed).toEqual(["relay-job-job-c"]);
    expect(workspace.phases).toEqual(["create", "clone", "destroy"]);
  });

  it("uses a fixture workspace in mock mode and never calls Docker", async () => {
    const docker = fakeDocker();
    const create = vi.spyOn(docker, "create");
    const broker = createCredentialBroker();
    const root = await mkdtemp(join(tmpdir(), "relay-runner-"));
    roots.push(root);
    const workspace = await openWorkspace({
      jobId: "job-mock",
      mode: "mock",
      broker,
      root,
      docker,
    });
    expect(workspace.kind).toBe("fixture");
    await workspace.create();
    await workspace.clone();
    await workspace.install();
    await workspace.destroy();
    expect(create).not.toHaveBeenCalled();
    expect(docker.created).toHaveLength(0);
    expect(broker.hasJob("job-mock")).toBe(false);
    expect(workspace.phases).toEqual(["create", "clone", "install", "destroy"]);
  });
});
