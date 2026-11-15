import type { ConnectorId } from "@relay/core";

export type SourceConnectorId = Exclude<ConnectorId, "ontology">;

export const SOURCE_CONNECTOR_IDS: SourceConnectorId[] = [
  "salesforce",
  "powerbi",
  "jira",
  "confluence",
  "databricks",
  "github",
];

export const CONNECTOR_LABELS: Record<SourceConnectorId, string> = {
  salesforce: "Salesforce",
  powerbi: "Power BI",
  jira: "Jira",
  confluence: "Confluence",
  databricks: "Databricks",
  github: "GitHub",
};

export function connectorLabel(id: SourceConnectorId | string): string {
  return CONNECTOR_LABELS[id as SourceConnectorId] ?? id;
}
