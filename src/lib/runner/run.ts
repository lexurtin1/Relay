import { prisma } from "@relay/core";
import {
  AgentEventType,
  RunnerJobStatus,
  WorkstreamStage,
} from "@prisma/client";
import { appendDemoEvent } from "@/lib/demo-agent-store";
import {
  applyDemoRunnerPause,
  clearDemoRunnerQuestion,
  finishDemoRunner,
  getDemoRunnerState,
  patchDemoRunnerState,
  seedDemoRunnerFromHandOff,
} from "@/lib/demo-runner-store";
import { useDemoFixtures } from "@/lib/db";
import { getDemoWorkstreamDetail } from "@/lib/demo-data";
import {
  buildRunnerResumeScript,
  buildRunnerScript,
  sleep,
  type RunnerScriptEvent,
} from "@/lib/runner/script";

const runningJobs = new Set<string>();

export async function startRunnerAfterHandOff(input: {
  workstreamId: string;
  runnerJobId: string;
}): Promise<void> {
  if (useDemoFixtures()) {
    seedDemoRunnerFromHandOff(input.workstreamId, input.runnerJobId);
    void runDemoScript(input.workstreamId, "initial");
    return;
  }

  await prisma.runnerJob.update({
    where: { id: input.runnerJobId },
    data: {
      status: RunnerJobStatus.provisioning,
      startedAt: new Date(),
      workspacePath: "demo-repos/ops-tools",
      branch: `relay/${input.workstreamId.slice(0, 8)}`,
    },
  });

  void runDbScript(input.workstreamId, input.runnerJobId, "initial");
}

export async function answerRunnerQuestion(input: {
  workstreamId: string;
  answer: string;
  answeredById: string;
}): Promise<{ ok: true }> {
  const answer = input.answer.trim();
  if (!answer) throw new Error("Answer is required.");

  if (useDemoFixtures()) {
    const runner = getDemoRunnerState(input.workstreamId);
    if (!runner?.openQuestion) throw new Error("No open Runner question.");
    appendDemoEvent(input.workstreamId, {
      type: "answer",
      summary: `You answered: ${answer}`,
    });
    clearDemoRunnerQuestion(input.workstreamId);
    void runDemoScript(input.workstreamId, "resume");
    return { ok: true };
  }

  const job = await prisma.runnerJob.findFirst({
    where: { workstreamId: input.workstreamId },
    include: { questions: { where: { answer: null }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
  if (!job) throw new Error("Runner job not found.");
  const question = job.questions[0];
  if (!question) throw new Error("No open Runner question.");

  await prisma.question.update({
    where: { id: question.id },
    data: {
      answer,
      answeredById: input.answeredById,
      answeredAt: new Date(),
    },
  });

  await prisma.agentEvent.create({
    data: {
      runnerJobId: job.id,
      type: AgentEventType.answer,
      payload: { summary: `You answered: ${answer}`, answer },
    },
  });

  await prisma.runnerJob.update({
    where: { id: job.id },
    data: { status: RunnerJobStatus.running },
  });
  await prisma.workstream.update({
    where: { id: input.workstreamId },
    data: { stage: WorkstreamStage.building, lastActivityAt: new Date() },
  });

  void runDbScript(input.workstreamId, job.id, "resume");
  return { ok: true };
}

async function runDemoScript(
  workstreamId: string,
  phase: "initial" | "resume",
): Promise<void> {
  const key = `demo:${workstreamId}:${phase}`;
  if (runningJobs.has(key)) return;
  runningJobs.add(key);

  try {
    const detail = getDemoWorkstreamDetail(workstreamId);
    const script =
      phase === "resume"
        ? buildRunnerResumeScript()
        : buildRunnerScript({
            title: detail?.title ?? "workstream",
            workstreamId,
          });

    patchDemoRunnerState(workstreamId, { status: "running", paused: false });

    for (const step of script) {
      await sleep(step.delayMs);
      await applyDemoStep(workstreamId, step);
      if (step.pause) return;
    }

    const prUrl =
      "https://github.com/example-calastone/ops-tools/pull/42";
    finishDemoRunner(workstreamId, { prUrl });
  } finally {
    runningJobs.delete(key);
  }
}

async function applyDemoStep(
  workstreamId: string,
  step: RunnerScriptEvent,
): Promise<void> {
  if (step.type === "status" && step.payload?.workspacePath) {
    patchDemoRunnerState(workstreamId, {
      status: "provisioning",
      workspacePath: String(step.payload.workspacePath),
      branch: step.payload.branch ? String(step.payload.branch) : undefined,
    });
  }
  if (step.type === "status" && step.payload?.prUrl) {
    patchDemoRunnerState(workstreamId, {
      prUrl: String(step.payload.prUrl),
    });
  }

  appendDemoEvent(workstreamId, {
    type: step.type,
    summary: step.summary,
  });

  if (step.pause && step.payload) {
    applyDemoRunnerPause(workstreamId, {
      questionText: String(step.payload.questionText ?? step.summary),
      options: Array.isArray(step.payload.options)
        ? (step.payload.options as string[])
        : [],
    });
  } else if (step.type !== "question") {
    patchDemoRunnerState(workstreamId, { status: "running" });
  }
}

async function runDbScript(
  workstreamId: string,
  runnerJobId: string,
  phase: "initial" | "resume",
): Promise<void> {
  const key = `db:${runnerJobId}:${phase}`;
  if (runningJobs.has(key)) return;
  runningJobs.add(key);

  try {
    const workstream = await prisma.workstream.findUnique({
      where: { id: workstreamId },
    });
    if (!workstream) return;

    const script =
      phase === "resume"
        ? buildRunnerResumeScript()
        : buildRunnerScript({
            title: workstream.title,
            workstreamId,
          });

    await prisma.runnerJob.update({
      where: { id: runnerJobId },
      data: { status: RunnerJobStatus.running },
    });

    for (const step of script) {
      await sleep(step.delayMs);
      await applyDbStep(workstreamId, runnerJobId, step);
      if (step.pause) return;
    }

    const prUrl = "https://github.com/example-calastone/ops-tools/pull/42";
    await prisma.runnerJob.update({
      where: { id: runnerJobId },
      data: {
        status: RunnerJobStatus.succeeded,
        prUrl,
        finishedAt: new Date(),
      },
    });
    await prisma.workstream.update({
      where: { id: workstreamId },
      data: { stage: WorkstreamStage.pr_open, lastActivityAt: new Date() },
    });
    await prisma.agentEvent.create({
      data: {
        runnerJobId,
        type: AgentEventType.status,
        payload: { summary: `PR ready: ${prUrl}`, prUrl },
      },
    });
  } finally {
    runningJobs.delete(key);
  }
}

async function applyDbStep(
  workstreamId: string,
  runnerJobId: string,
  step: RunnerScriptEvent,
): Promise<void> {
  if (step.type === "status" && step.payload?.workspacePath) {
    await prisma.runnerJob.update({
      where: { id: runnerJobId },
      data: {
        status: RunnerJobStatus.provisioning,
        workspacePath: String(step.payload.workspacePath),
        branch: step.payload.branch ? String(step.payload.branch) : undefined,
      },
    });
  }

  const type = mapEventType(step.type);
  await prisma.agentEvent.create({
    data: {
      runnerJobId,
      type,
      payload: { summary: step.summary, ...(step.payload ?? {}) },
    },
  });

  if (step.pause) {
    const questionText = String(step.payload?.questionText ?? step.summary);
    const options = Array.isArray(step.payload?.options)
      ? (step.payload!.options as string[])
      : [];
    await prisma.question.create({
      data: {
        runnerJobId,
        questionText,
        options,
      },
    });
    await prisma.runnerJob.update({
      where: { id: runnerJobId },
      data: { status: RunnerJobStatus.awaiting_input },
    });
    await prisma.workstream.update({
      where: { id: workstreamId },
      data: {
        stage: WorkstreamStage.awaiting_input,
        lastActivityAt: new Date(),
      },
    });
    return;
  }

  if (step.payload?.prUrl) {
    await prisma.runnerJob.update({
      where: { id: runnerJobId },
      data: { prUrl: String(step.payload.prUrl) },
    });
  } else {
    await prisma.runnerJob.update({
      where: { id: runnerJobId },
      data: { status: RunnerJobStatus.running },
    });
  }
}

function mapEventType(type: RunnerScriptEvent["type"]): AgentEventType {
  switch (type) {
    case "file_edit":
      return AgentEventType.file_edit;
    case "test_run":
      return AgentEventType.test_run;
    case "thought_summary":
      return AgentEventType.thought_summary;
    case "question":
      return AgentEventType.question;
    default:
      return AgentEventType.status;
  }
}
