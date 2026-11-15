import { describe, expect, it } from "vitest";
import {
  createDemoIdea,
  listDemoIdeas,
  updateDemoIdeaStatus,
} from "./demo-ideas";

describe("ideas demo store", () => {
  it("lists seeded ideas with mixed statuses", () => {
    const all = listDemoIdeas();
    expect(all.length).toBeGreaterThan(3);
    expect(all.some((i) => i.status === "new")).toBe(true);
    expect(all.some((i) => i.status === "promoted")).toBe(true);
  });

  it("creates friction ideas and updates triage status", () => {
    const idea = createDemoIdea({
      title: "Test friction",
      description: "Repeated copy-paste between tools",
      type: "friction_log",
      submittedById: "demo-alex",
      submittedByName: "Alex Curtin",
      frequencyPerWeek: 4,
      minutesLostEach: 15,
    });
    expect(idea.frequencyPerWeek! * idea.minutesLostEach!).toBe(60);
    expect(idea.status).toBe("new");

    const parked = updateDemoIdeaStatus(idea.id, "parked");
    expect(parked.status).toBe("parked");
  });
});
