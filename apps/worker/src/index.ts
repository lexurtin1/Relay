import { config, isMockMode } from "@relay/core";

async function main() {
  const startedAt = new Date().toISOString();
  console.log(
    JSON.stringify({
      service: "relay-worker",
      status: "booted",
      appName: config.appName,
      mode: isMockMode() ? "mock" : "live",
      redisUrl: config.redisUrl,
      startedAt,
      note: "Scout and Planner run in-process from the web app in Milestone 3. BullMQ processors land with Runner in Milestone 5. Heartbeat only for now.",
    }),
  );

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
