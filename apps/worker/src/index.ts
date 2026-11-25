import { config, isMockMode } from "@relay/core";
import { startAnthropicShim } from "@relay/core/llm/anthropic-shim";
import { startToolshedHttp } from "@relay/connectors/toolshed";
import { createCredentialBroker } from "./runner/broker";
import { processStoredRunnerJob } from "./runner/prisma-store";
import { startRunnerConsumer } from "./queue";

async function main() {
  const startedAt = new Date().toISOString();
  const broker = createCredentialBroker();
  console.log(
    JSON.stringify({
      service: "relay-worker",
      status: "booted",
      appName: config.appName,
      mode: isMockMode() ? "mock" : "live",
      redisUrl: config.redisUrl,
      startedAt,
      note: "Runner consumer, Anthropic shim, and Toolshed are up. Heartbeat continues.",
    }),
  );

  startAnthropicShim(config.shimPort, { tokens: broker });
  startToolshedHttp(config.toolshedPort);
  startRunnerConsumer({
    redisUrl: config.redisUrl,
    handler: (jobId) => processStoredRunnerJob(jobId, broker),
  });

  setInterval(() => {
    console.log(
      JSON.stringify({
        service: "relay-worker",
        status: "heartbeat",
        at: new Date().toISOString(),
      }),
    );
  }, 30_000);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
