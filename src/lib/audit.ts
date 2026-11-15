import { prisma } from "@relay/core";
import type { AuditAction } from "@prisma/client";
import { useDemoFixtures } from "@/lib/db";
import { appendDemoAudit, listDemoAudit, type DemoAuditRow } from "@/lib/demo-audit";

export type AuditRowView = {
  id: string;
  action: AuditAction;
  userName: string | null;
  detail: string | null;
  workstreamId: string | null;
  tokens: number | null;
  createdAt: string;
};

export async function listAuditLogs(filters?: {
  action?: AuditAction | "all";
  q?: string;
}): Promise<AuditRowView[]> {
  const action = filters?.action && filters.action !== "all" ? filters.action : undefined;
  const q = filters?.q?.trim().toLowerCase();

  if (useDemoFixtures()) {
    return listDemoAudit()
      .filter((row) => (action ? row.action === action : true))
      .filter((row) => {
        if (!q) return true;
        return (
          (row.detail ?? "").toLowerCase().includes(q) ||
          (row.userName ?? "").toLowerCase().includes(q) ||
          row.action.toLowerCase().includes(q)
        );
      })
      .map(toView);
  }

  const rows = await prisma.auditLog.findMany({
    where: action ? { action } : undefined,
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return rows
    .map((row) => ({
      id: row.id,
      action: row.action,
      userName: row.user?.name ?? null,
      detail: row.detail,
      workstreamId: row.workstreamId,
      tokens:
        row.tokenInput != null || row.tokenOutput != null
          ? (row.tokenInput ?? 0) + (row.tokenOutput ?? 0)
          : null,
      createdAt: row.createdAt.toISOString(),
    }))
    .filter((row) => {
      if (!q) return true;
      return (
        (row.detail ?? "").toLowerCase().includes(q) ||
        (row.userName ?? "").toLowerCase().includes(q) ||
        row.action.toLowerCase().includes(q)
      );
    });
}

export async function recordAudit(input: {
  action: AuditAction;
  userId?: string | null;
  userName?: string | null;
  detail?: string | null;
  workstreamId?: string | null;
  planId?: string | null;
  runnerJobId?: string | null;
  tokenInput?: number | null;
  tokenOutput?: number | null;
  connectorItemsAccessed?: unknown;
}): Promise<void> {
  if (useDemoFixtures()) {
    appendDemoAudit({
      action: input.action,
      userId: input.userId ?? null,
      userName: input.userName ?? null,
      detail: input.detail ?? null,
      workstreamId: input.workstreamId ?? null,
      planId: input.planId ?? null,
      runnerJobId: input.runnerJobId ?? null,
      tokenInput: input.tokenInput ?? null,
      tokenOutput: input.tokenOutput ?? null,
    });
    return;
  }

  await prisma.auditLog.create({
    data: {
      action: input.action,
      userId: input.userId ?? null,
      detail: input.detail ?? null,
      workstreamId: input.workstreamId ?? null,
      planId: input.planId ?? null,
      runnerJobId: input.runnerJobId ?? null,
      tokenInput: input.tokenInput ?? null,
      tokenOutput: input.tokenOutput ?? null,
      connectorItemsAccessed: input.connectorItemsAccessed ?? undefined,
    },
  });
}

function toView(row: DemoAuditRow): AuditRowView {
  return {
    id: row.id,
    action: row.action,
    userName: row.userName,
    detail: row.detail,
    workstreamId: row.workstreamId,
    tokens:
      row.tokenInput != null || row.tokenOutput != null
        ? (row.tokenInput ?? 0) + (row.tokenOutput ?? 0)
        : null,
    createdAt: row.createdAt,
  };
}
