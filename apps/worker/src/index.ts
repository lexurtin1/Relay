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
      note: "Milestone 5 mock Runner progresses in-process from the web app after hand-off. BullMQ consumers can replace that path later. Heartbeat only here for now.",
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
