import { Queue, Worker, type ConnectionOptions } from "bullmq";
import { RUNNER_QUEUE_NAME, redisConnectionOptions } from "@relay/core/runner/queue-name";

export { RUNNER_QUEUE_NAME };

let queue: Queue | null = null;

export function getRunnerQueue(redisUrl: string): Queue {
  if (!queue) {
    queue = new Queue(RUNNER_QUEUE_NAME, {
      connection: redisConnectionOptions(redisUrl) as ConnectionOptions,
    });
  }
  return queue;
}

export async function enqueueRunnerJob(jobId: string, redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379"): Promise<void> {
  await getRunnerQueue(redisUrl).add("run", { jobId }, { jobId });
}

export function startRunnerConsumer(opts: {
  redisUrl: string;
  handler: (jobId: string) => Promise<void>;
}): Worker {
  const worker = new Worker(
    RUNNER_QUEUE_NAME,
    async (job) => {
      const jobId = (job.data as { jobId?: string }).jobId;
      if (!jobId) throw new Error("Runner job is missing jobId");
      await opts.handler(jobId);
    },
    { connection: redisConnectionOptions(opts.redisUrl) as ConnectionOptions },
  );
  worker.on("failed", (job, error) => {
    console.error(
      JSON.stringify({
        service: "relay-worker",
        status: "job_failed",
        jobId: job?.id,
        message: error.message,
      }),
    );
  });
  return worker;
}
