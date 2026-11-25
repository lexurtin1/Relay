import { randomUUID } from "node:crypto";
import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "./db";

/** Actions stored on the existing AuditLog table. `tool_call` is the Runner addition. */
export type AuditActionName =
  | "model_call"
  | "approval"
  | "hand_off"
  | "connector_access"
  | "role_switch"
  | "seed"
  | "tool_call";

export interface AuditWrite {
  action: AuditActionName;
  userId?: string | null;
  modelId?: string | null;
  tokenInput?: number | null;
  tokenOutput?: number | null;
  connectorItemsAccessed?: Prisma.InputJsonValue | null;
  workstreamId?: string | null;
  planId?: string | null;
  runnerJobId?: string | null;
  detail?: string | null;
}

/** Row shape matching AuditLog, so callers can read back what they wrote. */
export interface AuditRecord {
  id: string;
  action: AuditActionName;
  userId: string | null;
  modelId: string | null;
  tokenInput: number | null;
  tokenOutput: number | null;
  connectorItemsAccessed: Prisma.InputJsonValue | null;
  workstreamId: string | null;
  planId: string | null;
  runnerJobId: string | null;
  detail: string | null;
  createdAt: Date;
}

export interface AuditStore {
  write(row: AuditRecord): Promise<void>;
  list(): Promise<AuditRecord[]>;
}

export function createMemoryAuditStore(): AuditStore & { rows: AuditRecord[] } {
  const rows: AuditRecord[] = [];
  return {
    rows,
    async write(row) {
      rows.push(row);
    },
    async list() {
      return [...rows];
    },
  };
}

function toRecord(input: AuditWrite): AuditRecord {
  return {
    id: `audit_${randomUUID()}`,
    action: input.action,
    userId: input.userId ?? null,
    modelId: input.modelId ?? null,
    tokenInput: input.tokenInput ?? null,
    tokenOutput: input.tokenOutput ?? null,
    connectorItemsAccessed: input.connectorItemsAccessed ?? null,
    workstreamId: input.workstreamId ?? null,
    planId: input.planId ?? null,
    runnerJobId: input.runnerJobId ?? null,
    detail: input.detail ?? null,
    createdAt: new Date(),
  };
}

/**
 * Write one AuditLog row. Pass a store in tests. The default store is Postgres.
 */
export async function writeAudit(input: AuditWrite, store?: AuditStore): Promise<AuditRecord> {
  const record = toRecord(input);
  if (store) {
    await store.write(record);
    return record;
  }

  await prisma.auditLog.create({
    data: {
      id: record.id,
      action: record.action as AuditAction,
      userId: record.userId,
      modelId: record.modelId,
      tokenInput: record.tokenInput,
      tokenOutput: record.tokenOutput,
      connectorItemsAccessed: record.connectorItemsAccessed ?? undefined,
      workstreamId: record.workstreamId,
      planId: record.planId,
      runnerJobId: record.runnerJobId,
      detail: record.detail,
      createdAt: record.createdAt,
    },
  });
  return record;
}

/** Record an approval that has already been stored on the Approval table. */
export async function auditStoredApproval(
  input: { userId: string; planId: string; workstreamId?: string | null; detail?: string },
  store?: AuditStore,
): Promise<AuditRecord> {
  return writeAudit(
    {
      action: "approval",
      userId: input.userId,
      planId: input.planId,
      workstreamId: input.workstreamId ?? null,
      detail: input.detail ?? "Plan approved",
    },
    store,
  );
}
