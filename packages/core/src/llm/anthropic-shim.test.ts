import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryAuditStore } from "../audit";
import { createMessage } from "./gateway";
import { handleAnthropicMessages } from "./anthropic-shim";

const tokens = {
  checkJobToken(token: string) {
    return token === "job-token" ? { jobId: "job-1" } : null;
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("anthropic shim", () => {
  it("sends the Anthropic body through createMessage and not a provider host", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const seen: unknown[] = [];
    const audit = createMemoryAuditStore();

    const result = await handleAnthropicMessages(
      { "x-api-key": "job-token", "anthropic-version": "2023-06-01" },
      JSON.stringify({
        model: "claude-opus-5-5",
        max_tokens: 128,
        system: "Stay in the workspace.",
        messages: [{ role: "user", content: "Plan the edit." }],
      }),
      {
        tokens,
        audit,
        createMessage: async (request) => {
          seen.push(request);
          return createMessage(request);
        },
      },
    );

    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({
      system: "Stay in the workspace.",
      maxTokens: 128,
      messages: [{ role: "user", content: "Plan the edit." }],
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    const hosts = fetchSpy.mock.calls.map((call) => String(call[0]));
    expect(hosts.some((host) => host.includes("anthropic.com") || host.includes("openai.com"))).toBe(false);

    expect(result.status).toBe(200);
    const body = result.body as { content: Array<{ text: string }>; model: string };
    expect(body.content[0]?.text).toContain("Mock mode response");
    expect(body.model).toBe("claude-opus-5-5");

    const rows = await audit.list();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      action: "model_call",
      runnerJobId: "job-1",
      modelId: "claude-opus-5-5",
      detail: "mock gateway",
    });
    expect(rows[0]?.tokenInput).toBeGreaterThan(0);
  });

  it("rejects a bad job token", async () => {
    const complete = vi.fn();
    const result = await handleAnthropicMessages(
      { "x-api-key": "nope" },
      JSON.stringify({ messages: [{ role: "user", content: "hi" }], max_tokens: 16 }),
      { tokens, createMessage: complete },
    );
    expect(result.status).toBe(401);
    expect(complete).not.toHaveBeenCalled();
  });
});
