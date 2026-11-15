import type {
  Connector,
  ConnectorHealth,
  ConnectorId,
  SourceDocument,
  SourceItem,
} from "@relay/core";
import { config } from "@relay/core";
import { createMockConnector } from "./mock-connector";

type SourceId = Exclude<ConnectorId, "ontology">;

function credentialFor(id: SourceId): { configured: boolean; label: string } {
  switch (id) {
    case "salesforce":
      return {
        configured: Boolean(config.salesforceInstanceUrl),
        label: "SALESFORCE_INSTANCE_URL",
      };
    case "jira":
      return { configured: Boolean(config.jiraBaseUrl), label: "JIRA_BASE_URL" };
    case "confluence":
      return {
        configured: Boolean(config.confluenceBaseUrl),
        label: "CONFLUENCE_BASE_URL",
      };
    case "powerbi":
      return {
        configured: Boolean(config.powerbiWorkspaceId),
        label: "POWERBI_WORKSPACE_ID",
      };
    case "databricks":
      return {
        configured: Boolean(config.databricksHost),
        label: "DATABRICKS_HOST",
      };
    case "github":
      return { configured: Boolean(config.githubToken), label: "GITHUB_TOKEN" };
    default:
      return { configured: false, label: "unknown" };
  }
}

/**
 * Live connector: health reflects credential presence.
 * Search/get fall back to mock corpus so demos never block on live APIs;
 * when credentials are present, health reports ready for future live calls.
 */
export function createLiveConnector(id: SourceId): Connector {
  const mock = createMockConnector(id);
  const creds = credentialFor(id);

  return {
    id,
    async search(query: string, opts?: { limit?: number }): Promise<SourceItem[]> {
      // Prototype: read-only mock corpus until live HTTP adapters are approved.
      return mock.search(query, opts);
    },
    async get(itemId: string): Promise<SourceDocument> {
      return mock.get(itemId);
    },
    async health(): Promise<ConnectorHealth> {
      if (!creds.configured) {
        return {
          ok: false,
          mode: "live",
          detail: `${creds.label} not set. Falling back to mock corpus for search.`,
        };
      }
      return {
        ok: true,
        mode: "live",
        detail: `${creds.label} configured. Live HTTP fetch not enabled in this prototype; search uses mock corpus.`,
      };
    },
  };
}
