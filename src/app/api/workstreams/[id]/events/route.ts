import { prisma } from "@relay/core";
import { useDemoFixtures } from "@/lib/db";
import { getDemoAgentState } from "@/lib/demo-agent-store";
import { getDemoRunnerState } from "@/lib/demo-runner-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "connected", workstreamId: id, at: new Date().toISOString() });

      let lastCount = -1;
      const tick = async () => {
        try {
          if (useDemoFixtures()) {
            const state = getDemoAgentState(id);
            const runner = getDemoRunnerState(id);
            const events = state.events ?? [];
            if (events.length !== lastCount) {
              lastCount = events.length;
              send({
                type: "snapshot",
                events: events.map((e) => ({
                  id: e.id,
                  type: e.type,
                  summary: e.summary,
                  createdAt: e.createdAt,
                })),
                researchStatus: state.researchStatus ?? "idle",
                planStatus: state.planStatus ?? "idle",
                runnerStatus: runner?.status ?? "idle",
                researchSummary: state.researchSummary ?? null,
                stage: state.stage ?? null,
                openQuestion: runner?.openQuestion ?? null,
              });
            }
            return;
          }

          const [run, job] = await Promise.all([
            prisma.researchRun.findFirst({
              where: { workstreamId: id },
              include: {
                events: { orderBy: { createdAt: "asc" }, take: 100 },
              },
              orderBy: { createdAt: "desc" },
            }),
            prisma.runnerJob.findFirst({
              where: { workstreamId: id },
              include: {
                events: { orderBy: { createdAt: "asc" }, take: 100 },
                questions: { where: { answer: null }, take: 1 },
              },
              orderBy: { createdAt: "desc" },
            }),
          ]);

          const researchEvents = (run?.events ?? []).map((e) => {
            const payload = (e.payload ?? {}) as { summary?: string };
            return {
              id: e.id,
              type: e.type,
              summary: payload.summary ?? e.type,
              createdAt: e.createdAt.toISOString(),
            };
          });
          const runnerEvents = (job?.events ?? []).map((e) => {
            const payload = (e.payload ?? {}) as { summary?: string };
            return {
              id: e.id,
              type: e.type,
              summary: payload.summary ?? e.type,
              createdAt: e.createdAt.toISOString(),
            };
          });

          const preferRunner =
            job &&
            (job.status === "queued" ||
              job.status === "provisioning" ||
              job.status === "running" ||
              job.status === "awaiting_input" ||
              job.status === "succeeded");
          const events = preferRunner
            ? [...researchEvents, ...runnerEvents]
            : researchEvents;

          if (events.length !== lastCount) {
            lastCount = events.length;
            send({
              type: "snapshot",
              events,
              researchStatus: run?.status ?? "idle",
              planStatus: "idle",
              runnerStatus: job?.status ?? "idle",
              researchSummary: run?.findings ?? null,
              stage: null,
              openQuestion: job?.questions[0]?.questionText ?? null,
            });
          }
        } catch (error) {
          send({
            type: "error",
            message: error instanceof Error ? error.message : "stream error",
          });
        }
      };

      await tick();
      const interval = setInterval(() => {
        void tick();
      }, 1200);

      const close = () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      _request.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
