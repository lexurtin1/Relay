import type { Connector, ConnectorId } from "@relay/core";
import { config } from "@relay/core";

/**
 * Connector registry for relay-toolshed.
 * Milestone 2 will add mock and live implementations per source.
 * Ontology can be registered later without changing agent tool wiring.
 */
export function listConnectorIds(): ConnectorId[] {
  return ["salesforce", "powerbi", "jira", "confluence", "databricks", "github"];
}

export function getConnectorMode(): "mock" | "live" {
  return config.relayMode === "live" ? "live" : "mock";
}

export async function getConnector(_id: ConnectorId): Promise<Connector> {
  throw new Error(
    "Connectors are not implemented yet. Milestone 2 adds mock and live adapters.",
  );
}

export async function healthAll(): Promise<
  Array<{ id: ConnectorId; ok: boolean; mode: "mock" | "live"; detail?: string }>
> {
  return listConnectorIds().map((id) => ({
    id,
    ok: true,
    mode: getConnectorMode(),
    detail: "Stub health check (Milestone 1). Real checks arrive in Milestone 2.",
  }));
}
