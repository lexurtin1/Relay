import type { Server } from "node:http";
import { createServer } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import type { AuditStore } from "@relay/core/audit";
import { writeAudit } from "@relay/core/audit";
import type { SourceItem } from "@relay/core";
import { searchKnowledge, getConnector, type SourceConnectorId } from "../index";

export const TOOLSHED_TOOL_NAMES = ["knowledge_search", "knowledge_get"] as const;

const SOURCES = ["salesforce", "powerbi", "jira", "confluence", "databricks", "datadog", "github"] as const;

export interface ToolshedDeps {
  audit?: AuditStore;
  search?: typeof searchKnowledge;
  get?: (source: SourceConnectorId, id: string) => Promise<{ id: string; connectorId: string; title: string; body: string }>;
  workstreamId?: string | null;
  planId?: string | null;
  runnerJobId?: string | null;
}

function text(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function itemsAccessed(items: SourceItem[]) {
  return items.map((item) => ({
    connectorId: item.connectorId,
    id: item.id,
    title: item.title,
  }));
}

/**
 * One MCP server over the read-only connector surface. No write tools.
 */
export function createToolshedServer(deps: ToolshedDeps = {}): McpServer {
  const server = new McpServer({ name: "Toolshed", version: "1.0.0" });
  const search = deps.search ?? searchKnowledge;
  const get =
    deps.get ??
    (async (source: SourceConnectorId, id: string) => {
      const doc = await getConnector(source).get(id);
      return { id: doc.id, connectorId: doc.connectorId, title: doc.title, body: doc.body };
    });

  server.registerTool(
    "knowledge_search",
    {
      description: "Search Relay research connectors. Read only. Returns titles, ids, and snippets.",
      inputSchema: {
        query: z.string().describe("Text to search for"),
        source: z.enum(SOURCES).optional().describe("Limit the search to one connector"),
      },
    },
    async ({ query, source }) => {
      const items = await search({
        query,
        sources: source ? [source] : undefined,
        limit: 8,
      });
      await writeAudit(
        {
          action: "tool_call",
          detail: `knowledge_search ${query}`,
          connectorItemsAccessed: itemsAccessed(items),
          workstreamId: deps.workstreamId ?? null,
          planId: deps.planId ?? null,
          runnerJobId: deps.runnerJobId ?? null,
        },
        deps.audit,
      );
      return { content: [{ type: "text" as const, text: text(items) }] };
    },
  );

  server.registerTool(
    "knowledge_get",
    {
      description: "Fetch one research document by connector and id. Read only.",
      inputSchema: {
        source: z.enum(SOURCES).describe("Connector id"),
        id: z.string().describe("Document id from knowledge_search"),
      },
    },
    async ({ source, id }) => {
      try {
        const doc = await get(source, id);
        await writeAudit(
          {
            action: "tool_call",
            detail: `knowledge_get ${source} ${id}`,
            connectorItemsAccessed: [{ connectorId: doc.connectorId, id: doc.id, title: doc.title }],
            workstreamId: deps.workstreamId ?? null,
            planId: deps.planId ?? null,
            runnerJobId: deps.runnerJobId ?? null,
          },
          deps.audit,
        );
        return { content: [{ type: "text" as const, text: text(doc) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Document not found";
        return { content: [{ type: "text" as const, text: message }], isError: true };
      }
    },
  );

  return server;
}

export function startToolshedHttp(port: number, deps: ToolshedDeps = {}): Server {
  const server = createServer((req, res) => {
    const path = (req.url ?? "").split("?")[0];
    if (path !== "/mcp") {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }
    if (req.method !== "POST") {
      res.writeHead(405, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      void (async () => {
        let body: unknown;
        try {
          body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch {
          res.writeHead(400, { "content-type": "application/json" });
          res.end(JSON.stringify({ error: "Body must be JSON" }));
          return;
        }
        const mcp = createToolshedServer(deps);
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableJsonResponse: true,
        });
        try {
          await mcp.connect(transport);
          await transport.handleRequest(req, res, body);
        } catch (error) {
          if (!res.headersSent) {
            const message = error instanceof Error ? error.message : "Toolshed error";
            res.writeHead(500, { "content-type": "application/json" });
            res.end(JSON.stringify({ error: message }));
          }
        } finally {
          res.on("close", () => {
            void transport.close();
            void mcp.close();
          });
        }
      })();
    });
  });
  server.listen(port);
  return server;
}
