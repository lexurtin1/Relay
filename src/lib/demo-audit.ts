import type { AuditAction } from "@prisma/client";
import { DEMO_USERS } from "@/lib/demo-data";

export type DemoAuditRow = {
  id: string;
  action: AuditAction;
  userId: string | null;
  userName: string | null;
  detail: string | null;
  workstreamId: string | null;
  planId: string | null;
  runnerJobId: string | null;
  tokenInput: number | null;
  tokenOutput: number | null;
  createdAt: string;
};

const globalStore = globalThis as typeof globalThis & {
  __relayDemoAudit?: DemoAuditRow[];
};

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

function seedAudit(): DemoAuditRow[] {
  const alex = DEMO_USERS[0]!;
  const aisha = DEMO_USERS[2]!;
  const leon = DEMO_USERS[3]!;
  return [
    {
      id: "audit-1",
      action: "seed",
      userId: leon.id,
      userName: leon.name,
      detail: "Milestone demo seed applied",
      workstreamId: null,
      planId: null,
      runnerJobId: null,
      tokenInput: null,
      tokenOutput: null,
      createdAt: hoursAgo(48),
    },
    {
      id: "audit-2",
      action: "model_call",
      userId: alex.id,
      userName: alex.name,
      detail: "Scout research completed",
      workstreamId: "demo-ws-isin",
      planId: null,
      runnerJobId: null,
      tokenInput: 1200,
      tokenOutput: 480,
      createdAt: hoursAgo(20),
    },
    {
      id: "audit-3",
      action: "model_call",
      userId: alex.id,
      userName: alex.name,
      detail: "Planner created plan v2",
      workstreamId: "demo-ws-isin",
      planId: "demo-ws-isin-plan-v2",
      runnerJobId: null,
      tokenInput: 1800,
      tokenOutput: 900,
      createdAt: hoursAgo(12),
    },
    {
      id: "audit-4",
      action: "approval",
      userId: aisha.id,
      userName: aisha.name,
      detail: "Plan v2 approved",
      workstreamId: "demo-ws-nav",
      planId: null,
      runnerJobId: null,
      tokenInput: null,
      tokenOutput: null,
      createdAt: hoursAgo(10),
    },
    {
      id: "audit-5",
      action: "hand_off",
      userId: alex.id,
      userName: alex.name,
      detail: "Handed off to Runner (queued)",
      workstreamId: "demo-ws-nav",
      planId: null,
      runnerJobId: "demo-runner-nav",
      tokenInput: null,
      tokenOutput: null,
      createdAt: hoursAgo(9),
    },
    {
      id: "audit-6",
      action: "connector_access",
      userId: alex.id,
      userName: alex.name,
      detail: "Knowledge search: ISIN (8 items)",
      workstreamId: null,
      planId: null,
      runnerJobId: null,
      tokenInput: null,
      tokenOutput: null,
      createdAt: hoursAgo(3),
    },
    {
      id: "audit-7",
      action: "role_switch",
      userId: alex.id,
      userName: alex.name,
      detail: "Switched session user",
      workstreamId: null,
      planId: null,
      runnerJobId: null,
      tokenInput: null,
      tokenOutput: null,
      createdAt: hoursAgo(1),
    },
  ];
}

function store(): DemoAuditRow[] {
  if (!globalStore.__relayDemoAudit) {
    globalStore.__relayDemoAudit = seedAudit();
  }
  return globalStore.__relayDemoAudit;
}

export function listDemoAudit(): DemoAuditRow[] {
  return [...store()].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function appendDemoAudit(
  row: Omit<DemoAuditRow, "id" | "createdAt"> & { id?: string; createdAt?: string },
): DemoAuditRow {
  const next: DemoAuditRow = {
    id: row.id ?? `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    action: row.action,
    userId: row.userId,
    userName: row.userName,
    detail: row.detail,
    workstreamId: row.workstreamId,
    planId: row.planId,
    runnerJobId: row.runnerJobId,
    tokenInput: row.tokenInput,
    tokenOutput: row.tokenOutput,
    createdAt: row.createdAt ?? new Date().toISOString(),
  };
  store().unshift(next);
  return next;
}
