export type ConnectorId =
  | "salesforce"
  | "powerbi"
  | "jira"
  | "confluence"
  | "databricks"
  | "github"
  | "ontology";

export type ConnectorMode = "mock" | "live";

export interface SourceItem {
  id: string;
  connectorId: ConnectorId;
  title: string;
  snippet: string;
  url?: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface SourceDocument {
  id: string;
  connectorId: ConnectorId;
  title: string;
  body: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

export interface ConnectorHealth {
  ok: boolean;
  mode: ConnectorMode;
  detail?: string;
}

export interface Connector {
  id: Exclude<ConnectorId, "ontology"> | "ontology";
  search(query: string, opts?: { limit?: number }): Promise<SourceItem[]>;
  get(itemId: string): Promise<SourceDocument>;
  health(): Promise<ConnectorHealth>;
}
