import { prisma } from "@relay/core";
import { isDemoMode } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { runnerIsWorking, toRunnerView } from "@/lib/runner-snapshot";

export const dynamic = "force-dynamic";

async function snapshot(workstreamId: string) {
  const ws = await prisma.workstream.findUnique({
    where: { id: workstreamId },
    include: {
      plans: { include: { steps: true }, orderBy: { versionNumber: "desc" }, take: 1 },
      runnerJobs: {
        include: {
          events: { orderBy: { createdAt: "asc" }, take: 80 },
          questions: { include: { answeredBy: true }, orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!ws) return null;
  const job = ws.runnerJobs[0];
  const steps = ws.plans[0]?.steps ?? [];
  const runner = job
    ? toRunnerView(
        {
          status: job.status,
          branch: job.branch,
          prUrl: job.prUrl,
          additionalInstructions: job.additionalInstructions,
          events: job.events,
          questions: job.questions.map((question) => ({
            questionText: question.questionText,
            options: question.options,
            answer: question.answer,
            answeredByName: question.answeredBy?.name ?? null,
          })),
        },
        steps.filter((step) => step.completed).length,
        steps.length,
      )
    : null;
  return {
    stage: ws.stage,
    runner,
    terminal: !job || !runnerIsWorking(job.status),
  };
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (isDemoMode()) {
    return new Response("Demo mode keeps the Runner in the browser.", { status: 404 });
  }
  const user = await getCurrentUser();
  if (!user) return new Response("Sign in required.", { status: 401 });

  const { id } = await context.params;
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const finish = () => {
        if (closed) return;
        closed = true;
        clearInterval(timer);
        try {
          controller.close();
        } catch {
          // The client already went away.
        }
      };

      const send = async () => {
        if (closed) return true;
        const snap = await snapshot(id);
        if (!snap || closed) return true;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(snap)}\n\n`));
        return snap.terminal;
      };

      const timer = setInterval(() => {
        void send()
          .then((done) => {
            if (done) finish();
          })
          .catch(() => finish());
      }, 1500);

      void send()
        .then((done) => {
          if (done) finish();
        })
        .catch(() => finish());

      request.signal.addEventListener("abort", () => finish());
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
