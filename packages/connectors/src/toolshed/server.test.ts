import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it } from "vitest";
import { createMemoryAuditStore } from "@relay/core/audit";
import { resetConnectorCache } from "../index";
import { TOOLSHED_TOOL_NAMES, createToolshedServer } from "./server";

afterEach(() => {
  resetConnectorCache();
});

async function connectedClient(audit = createMemoryAuditStore()) {
  const server = createToolshedServer({ audit });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "toolshed-test", version: "0.0.1" });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  return { client, audit, server };
}

describe("Toolshed", () => {
  it("lists only knowledge_search and knowledge_get", async () => {
    const { client, server } = await connectedClient();
    const listed = await client.listTools();
    const names = listed.tools.map((tool) => tool.name).sort();
    expect(names).toEqual([...TOOLSHED_TOOL_NAMES].sort());
    expect(names.some((name) => /write|create|update|delete|post/i.test(name))).toBe(false);
    await client.close();
    await server.close();
  });

  it("searches the mock corpus and records the items accessed", async () => {
    const { client, audit, server } = await connectedClient();
    const result = await client.callTool({
      name: "knowledge_search",
      arguments: { query: "ISIN", source: "github" },
    });
    const block = Array.isArray(result.content) ? result.content[0] : undefined;
    const text = block && typeof block === "object" && "text" in block ? String(block.text) : "";
    expect(text.toLowerCase()).toContain("github");
    expect(result.isError).not.toBe(true);

    const rows = await audit.list();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ action: "tool_call", detail: "knowledge_search ISIN" });
    const accessed = rows[0]?.connectorItemsAccessed;
    expect(Array.isArray(accessed)).toBe(true);
    expect((accessed as Array<{ connectorId: string }>).every((item) => item.connectorId === "github")).toBe(true);

    await client.close();
    await server.close();
  });
});
