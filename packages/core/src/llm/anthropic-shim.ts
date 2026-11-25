import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer, type Server } from "node:http";
import type { AuditStore, AuditWrite } from "../audit";
import { writeAudit } from "../audit";
import { createMessage, type GatewayMessage, type GatewayRequest, type GatewayResponse } from "./gateway";

export interface JobTokenCheck {
  checkJobToken(token: string): { jobId: string } | null;
}

export interface ShimDeps {
  tokens: JobTokenCheck;
  audit?: AuditStore;
  createMessage?: (request: GatewayRequest) => Promise<GatewayResponse>;
  context?: {
    workstreamId?: string | null;
    planId?: string | null;
    modelId?: string | null;
  };
}

type ContentBlock = { type?: string; text?: string };

function textFromContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return (content as ContentBlock[])
    .filter((block) => block && (block.type === "text" || typeof block.text === "string"))
    .map((block) => block.text ?? "")
    .join("\n");
}

function toGatewayRequest(body: Record<string, unknown>): GatewayRequest {
  const messages: GatewayMessage[] = [];
  const raw = Array.isArray(body.messages) ? body.messages : [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const role = (entry as { role?: string }).role;
    if (role !== "user" && role !== "assistant") continue;
    messages.push({ role, content: textFromContent((entry as { content?: unknown }).content) });
  }
  const system = typeof body.system === "string" ? body.system : textFromContent(body.system);
  return {
    messages,
    system: system || undefined,
    maxTokens: typeof body.max_tokens === "number" ? body.max_tokens : undefined,
    tools: Array.isArray(body.tools) ? body.tools : undefined,
  };
}

function tokenFrom(headers: IncomingMessage["headers"]): string {
  const apiKey = headers["x-api-key"];
  if (typeof apiKey === "string" && apiKey.trim()) return apiKey.trim();
  const auth = headers.authorization;
  if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return "";
}

export interface ShimResult {
  status: number;
  body: unknown;
}

/**
 * Anthropic-compatible /v1/messages. goose points ANTHROPIC_HOST here.
 * The only model client is createMessage, which calls the SS&C gateway.
 */
export async function handleAnthropicMessages(
  headers: IncomingMessage["headers"],
  rawBody: string,
  deps: ShimDeps,
): Promise<ShimResult> {
  const token = tokenFrom(headers);
  const job = deps.tokens.checkJobToken(token);
  if (!job) {
    return { status: 401, body: { type: "error", error: { type: "authentication_error", message: "Unknown job token" } } };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return { status: 400, body: { type: "error", error: { type: "invalid_request_error", message: "Body must be JSON" } } };
  }

  const request = toGatewayRequest(parsed);
  const complete = deps.createMessage ?? createMessage;
  const response = await complete(request);

  const audit: AuditWrite = {
    action: "model_call",
    modelId: response.model,
    tokenInput: response.usage.inputTokens,
    tokenOutput: response.usage.outputTokens,
    runnerJobId: job.jobId,
    workstreamId: deps.context?.workstreamId ?? null,
    planId: deps.context?.planId ?? null,
    detail: response.mocked ? "mock gateway" : "gateway",
  };
  await writeAudit(audit, deps.audit);

  return {
    status: 200,
    body: {
      id: response.id,
      type: "message",
      role: "assistant",
      model: response.model,
      content: [{ type: "text", text: response.content }],
      stop_reason: "end_turn",
      usage: {
        input_tokens: response.usage.inputTokens,
        output_tokens: response.usage.outputTokens,
      },
    },
  };
}

export function startAnthropicShim(port: number, deps: ShimDeps): Server {
  const server = createServer((req, res) => {
    void readBody(req).then(async (raw) => {
      if (req.method !== "POST" || (req.url ?? "").split("?")[0] !== "/v1/messages") {
        send(res, 404, { type: "error", error: { type: "not_found_error", message: "Not found" } });
        return;
      }
      try {
        const result = await handleAnthropicMessages(req.headers, raw, deps);
        send(res, result.status, result.body);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Shim error";
        send(res, 502, { type: "error", error: { type: "api_error", message } });
      }
    });
  });
  server.listen(port);
  return server;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json", "content-length": Buffer.byteLength(payload) });
  res.end(payload);
}
