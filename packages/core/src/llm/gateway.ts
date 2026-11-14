import { config, isMockMode } from "../config";

export interface GatewayMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GatewayRequest {
  messages: GatewayMessage[];
  system?: string;
  maxTokens?: number;
  tools?: unknown[];
}

export interface GatewayUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface GatewayResponse {
  id: string;
  model: string;
  content: string;
  usage: GatewayUsage;
  mocked: boolean;
}

/**
 * All model calls go through the SS&C AI Gateway.
 * Never call a model provider directly from apps or agents.
 */
export async function createMessage(
  request: GatewayRequest,
): Promise<GatewayResponse> {
  const model = config.modelId;

  if (isMockMode() || !config.aiGatewayBaseUrl || !config.aiGatewayApiKey) {
    return mockResponse(request, model);
  }

  const response = await fetch(`${config.aiGatewayBaseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": config.aiGatewayApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: request.maxTokens ?? 4096,
      system: request.system,
      messages: request.messages.filter((m) => m.role !== "system"),
      tools: request.tools,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI Gateway error ${response.status}: ${detail}`);
  }

  const data = (await response.json()) as {
    id: string;
    content?: Array<{ type: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };

  const text = (data.content ?? [])
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text)
    .join("\n");

  return {
    id: data.id,
    model,
    content: text,
    usage: {
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
    },
    mocked: false,
  };
}

function mockResponse(
  request: GatewayRequest,
  model: string,
): GatewayResponse {
  const lastUser = [...request.messages].reverse().find((m) => m.role === "user");
  const prompt = lastUser?.content ?? "";
  const content = [
    "Mock mode response from the Relay LLM gateway.",
    "No AI_GATEWAY_API_KEY is configured, so this is a deterministic stub.",
    "",
    `Echo of request (${Math.min(prompt.length, 280)} chars):`,
    prompt.slice(0, 280),
  ].join("\n");

  return {
    id: `mock_${Date.now()}`,
    model,
    content,
    usage: {
      inputTokens: Math.ceil(prompt.length / 4),
      outputTokens: Math.ceil(content.length / 4),
    },
    mocked: true,
  };
}
