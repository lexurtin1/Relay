export function getAppName(): string {
  return process.env.APP_NAME ?? "Relay";
}

export function getRelayMode(): "mock" | "live" {
  return process.env.RELAY_MODE === "live" ? "live" : "mock";
}

export function isMockMode(): boolean {
  return getRelayMode() === "mock" || !process.env.AI_GATEWAY_API_KEY;
}
