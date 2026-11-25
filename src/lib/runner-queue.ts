import { Queue, type ConnectionOptions } from "bullmq";
import { RUNNER_QUEUE_NAME, redisConnectionOptions } from "@relay/core/runner/queue-name";

let queue: Queue | null = null;

/** Add one Runner job. The worker consumes the same queue name. */
export async function enqueueRunnerJob(jobId: string, redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379"): Promise<void> {
  if (!queue) {
    queue = new Queue(RUNNER_QUEUE_NAME, {
      connection: redisConnectionOptions(redisUrl) as ConnectionOptions,
    });
  }
  await queue.add("run", { jobId }, { jobId });
}
