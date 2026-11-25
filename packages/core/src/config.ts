export type RelayMode = "mock" | "live";

function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  appName: optionalEnv("APP_NAME", "Relay"),
  relayMode: (optionalEnv("RELAY_MODE", "mock") as RelayMode),
  modelId: optionalEnv("MODEL_ID", "claude-opus-5-5"),
  aiGatewayBaseUrl: optionalEnv("AI_GATEWAY_BASE_URL", ""),
  aiGatewayApiKey: optionalEnv("AI_GATEWAY_API_KEY", ""),
  databaseUrl: optionalEnv("DATABASE_URL", ""),
  redisUrl: optionalEnv("REDIS_URL", "redis://localhost:6379"),
  tokenBudgetPerJob: intEnv("TOKEN_BUDGET_PER_JOB", 200_000),
  jobTimeoutMs: intEnv("JOB_TIMEOUT_MS", 30 * 60 * 1000),
  salesforceInstanceUrl: optionalEnv("SALESFORCE_INSTANCE_URL"),
  jiraBaseUrl: optionalEnv("JIRA_BASE_URL"),
  confluenceBaseUrl: optionalEnv("CONFLUENCE_BASE_URL"),
  powerbiWorkspaceId: optionalEnv("POWERBI_WORKSPACE_ID"),
  databricksHost: optionalEnv("DATABRICKS_HOST"),
  datadogSite: optionalEnv("DATADOG_SITE"),
  githubToken: optionalEnv("GITHUB_TOKEN"),
  shimPort: intEnv("RELAY_SHIM_PORT", 8787),
  toolshedPort: intEnv("RELAY_TOOLSHED_PORT", 8788),
  shimPublicHost: optionalEnv("RELAY_SHIM_HOST", "http://127.0.0.1:8787"),
  toolshedPublicUrl: optionalEnv("RELAY_TOOLSHED_URL", "http://127.0.0.1:8788/mcp"),
  runnerWorkspaceRoot: optionalEnv("RUNNER_WORKSPACE_ROOT", "demo-repos"),
  runnerImage: optionalEnv("RELAY_RUNNER_IMAGE", "relay-runner:local"),
};

export function isMockMode(): boolean {
  return config.relayMode === "mock" || !config.aiGatewayApiKey;
}

export function requireDatabaseUrl(): string {
  return env("DATABASE_URL");
}
