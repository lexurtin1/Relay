import { config, isMockMode, prisma } from "@relay/core";
import { writeAudit, type AuditWrite } from "@relay/core/audit";
import type { AgentEventType, Prisma, RunnerJobStatus, WorkstreamStage } from "@prisma/client";
import { createCredentialBroker, type CredentialBroker } from "./broker";
import { processRunnerJob, type ProcessDeps, type RunnerSink, type RunnerStatusName } from "./processor";
import { createDockerCli, openWorkspace } from "./sandbox";

export async function processStoredRunnerJob(jobId: string, broker: CredentialBroker = createCredentialBroker()): Promise<void> {
  const job = await prisma.runnerJob.findUnique({
    where: { id: jobId },
    include: {
      plan: { include: { approvals: true } },
      workstream: true,
    },
  });
  if (!job) throw new Error(`Runner job not found: ${jobId}`);

  const mode = isMockMode() ? "mock" : "live";
  const workspace = await openWorkspace({
    jobId: job.id,
    mode,
    broker,
    root: config.runnerWorkspaceRoot,
    docker: mode === "live" ? createDockerCli({ network: process.env.RELAY_JOB_NETWORK }) : undefined,
    image: config.runnerImage,
    repoUrl: process.env.RUNNER_REPO_URL ?? "",
  });

  const sink: RunnerSink = {
    async status(status: RunnerStatusName, extra) {
      await prisma.runnerJob.update({
        where: { id: job.id },
        data: {
          status: status as RunnerJobStatus,
          branch: extra?.branch,
          prUrl: extra?.prUrl,
          workspacePath: extra?.workspacePath,
          tokenUsage: extra?.tokenUsage,
          startedAt: status === "provisioning" ? new Date() : undefined,
          finishedAt: extra?.finished ? new Date() : undefined,
        },
      });
    },
    async stage(stage: string) {
      await prisma.workstream.update({
        where: { id: job.workstreamId },
        data: { stage: stage as WorkstreamStage, lastActivityAt: new Date() },
      });
    },
    async event(type, payload) {
      await prisma.agentEvent.create({
        data: {
          runnerJobId: job.id,
          type: type as AgentEventType,
          payload: payload as Prisma.InputJsonValue,
        },
      });
    },
    async question(text, options) {
      await prisma.question.create({
        data: { runnerJobId: job.id, questionText: text, options },
      });
    },
    async audit(row: AuditWrite) {
      await writeAudit(row);
    },
  };

  const deps: ProcessDeps = {
    sink,
    workspace,
    mode,
    shimHost: config.shimPublicHost,
    toolshedUrl: config.toolshedPublicUrl,
  };
  await processRunnerJob(
    {
      jobId: job.id,
      workstreamId: job.workstreamId,
      planId: job.planId,
      ownerId: job.workstream.ownerId,
      planStatus: job.plan.status,
      approvalCount: job.plan.approvals.length,
      planMarkdown: job.plan.markdownBody,
      additionalInstructions: job.additionalInstructions,
    },
    deps,
  );
}
