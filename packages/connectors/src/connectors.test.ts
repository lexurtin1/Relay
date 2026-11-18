import { afterEach, describe, expect, it } from "vitest";
import {
  getConnector,
  getConnectorMode,
  healthAll,
  listConnectorIds,
  resetConnectorCache,
  searchKnowledge,
} from "./index";

afterEach(() => {
  resetConnectorCache();
  delete process.env.RELAY_MODE;
  delete process.env.AI_GATEWAY_API_KEY;
});

describe("connectors registry", () => {
  it("lists the seven research sources", () => {
    expect(listConnectorIds()).toEqual([
      "salesforce",
      "powerbi",
      "jira",
      "confluence",
      "databricks",
      "datadog",
      "github",
    ]);
  });

  it("defaults to mock mode", () => {
    expect(getConnectorMode()).toBe("mock");
  });

  it("searches mock confluence for ISIN", async () => {
    const items = await getConnector("confluence").search("ISIN MCP");
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]?.connectorId).toBe("confluence");
    expect(items[0]?.title.toLowerCase()).toMatch(/isin|mcp/);
  });

  it("gets a document by id", async () => {
    const doc = await getConnector("jira").get("INNO-214");
    expect(doc.title).toContain("INNO-214");
    expect(doc.body.length).toBeGreaterThan(10);
  });

  it("reports healthy mock connectors", async () => {
    const rows = await healthAll();
    expect(rows).toHaveLength(7);
    expect(rows.every((r) => r.ok && r.mode === "mock")).toBe(true);
  });

  it("searches across sources", async () => {
    const items = await searchKnowledge({ query: "NAV exception", limit: 10 });
    expect(items.length).toBeGreaterThan(0);
    const sources = new Set(items.map((i) => i.connectorId));
    expect(sources.size).toBeGreaterThan(1);
  });

  it("filters by source", async () => {
    const items = await searchKnowledge({
      query: "ISIN",
      sources: ["github"],
      limit: 10,
    });
    expect(items.every((i) => i.connectorId === "github")).toBe(true);
  });
});
