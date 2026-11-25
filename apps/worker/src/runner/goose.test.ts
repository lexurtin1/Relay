import { describe, expect, it } from "vitest";
import { buildGooseLaunch, parseGooseStream } from "./goose";

describe("goose adapter", () => {
  it("points goose at the shim and Toolshed and omits the gateway key", () => {
    process.env.AI_GATEWAY_API_KEY = "super-secret";
    process.env.GITHUB_TOKEN = "gh-secret";
    const launch = buildGooseLaunch({
      model: "claude-opus-5-5",
      prompt: "Edit the handler.",
      shimHost: "http://worker:8787",
      jobToken: "job-token",
      toolshedUrl: "http://worker:8788/mcp",
      cwd: "/workspace",
    });

    expect(launch.argv).toContain("--provider");
    expect(launch.argv[launch.argv.indexOf("--provider") + 1]).toBe("anthropic");
    expect(launch.argv).toContain("--with-builtin");
    expect(launch.argv[launch.argv.indexOf("--with-builtin") + 1]).toBe("developer");
    expect(launch.argv).toContain("http://worker:8788/mcp");
    expect(launch.env.ANTHROPIC_HOST).toBe("http://worker:8787");
    expect(launch.env.ANTHROPIC_API_KEY).toBe("job-token");
    expect(launch.env.GOOSE_PROVIDER).toBe("anthropic");
    expect(launch.env.AI_GATEWAY_API_KEY).toBeUndefined();
    expect(launch.env.GITHUB_TOKEN).toBeUndefined();
    expect(launch.cwd).toBe("/workspace");
  });

  it("maps a stream-json log onto agent events", () => {
    const events = parseGooseStream(
      [
        JSON.stringify({ type: "text", text: "I will edit the handler." }),
        JSON.stringify({ type: "tool_call", name: "developer__shell", arguments: { command: "ls" } }),
        JSON.stringify({ type: "tool_result", name: "developer__shell", result: "ok" }),
        JSON.stringify({ type: "file_edit", path: "src/handler.ts" }),
      ].join("\n"),
    );
    expect(events.map((event) => event.type)).toEqual(["thought_summary", "tool_call", "tool_result", "file_edit"]);
    expect(events[3]?.payload.path).toBe("src/handler.ts");
  });
});
