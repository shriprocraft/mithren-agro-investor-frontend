import { describe, expect, it } from "vitest";
import { CATEGORIES } from "@/config/demo-config";
import { CONTRIBUTION_PLANS } from "@/data/contribution-plans";
import { createSeedState } from "@/data/seed";
import { addEnquiry, type EnquiryInput } from "@/lib/mock-service";
import { publishedProjects } from "@/lib/project-helpers";

describe("agricultural catalogue", () => {
  const s = createSeedState();
  const projects = publishedProjects(s);
  it("has exactly 12 unique projects, 2 per category", () => {
    expect(s.projects).toHaveLength(12);
    expect(projects).toHaveLength(12);
    expect(new Set(projects.map((p) => p.id)).size).toBe(12);
    expect(new Set(projects.map((p) => p.slug)).size).toBe(12);
    for (const c of CATEGORIES) expect(projects.filter((p) => p.category === c.id)).toHaveLength(2);
  });
  it("gives every project activities and no invented financials", () => {
    for (const p of projects) {
      expect((p.activities ?? []).length).toBeGreaterThanOrEqual(3);
      expect(p.analysis).toBeNull();
      expect(p.funding).toBeNull();
    }
  });
  it("keeps every seeded investment pointed at an existing project", () => {
    for (const i of s.investments) expect(s.projects.some((p) => p.id === i.projectId)).toBe(true);
  });
});

describe("contribution plans", () => {
  it("keeps the specified amounts and timelines", () => {
    expect(CONTRIBUTION_PLANS.map((p) => p.amount)).toEqual([1000, 10000, 25000, 50000, 100000]);
    expect(CONTRIBUTION_PLANS[0].phases.map((p) => p.timeline)).toEqual(["10 Weeks", "12 Weeks", "24 Weeks"]);
    expect(CONTRIBUTION_PLANS[4].phases.map((p) => p.timeline)).toEqual(["3 Months", "6 Months", "12 Months"]);
  });
});

describe("addEnquiry", () => {
  const s = createSeedState();
  const ok: EnquiryInput = { userId: null, name: "Asha", contact: "asha@example.com", projectId: "p-1", categoryId: null, planId: "growth", amount: "10000", message: "Hello" };
  it("records a valid enquiry", () => {
    const r = addEnquiry(s, ok);
    expect(r.ok && r.state.enquiries).toHaveLength(1);
  });
  it("rejects bad input and records nothing", () => {
    for (const bad of [{ name: "" }, { contact: "nope" }, { amount: "abc" }, { amount: "-5" }, { projectId: "p-999" }]) {
      expect(addEnquiry(s, { ...ok, ...bad }).ok).toBe(false);
    }
    expect(s.enquiries).toEqual([]);
  });
  it("accepts a phone number and a blank amount", () => {
    expect(addEnquiry(s, { ...ok, contact: "98765 43210", amount: "" }).ok).toBe(true);
  });
});

describe("illustrative dashboard data", () => {
  const s = createSeedState();
  const projects = publishedProjects(s);
  it("covers every project and derives the summary from them", async () => {
    const m = await import("@/data/project-dashboard-mock");
    for (const p of projects) expect(m.MOCK_PROJECTS[p.id]?.isMockData).toBe(true);
    expect(m.dashboardSummary(projects)).toMatchObject({ total: 12, active: 8, categories: 6, contributions: 850000 });
    for (const x of Object.values(m.MOCK_PROJECTS)) expect(x.progress >= 0 && x.progress <= 100 && x.trend.length === m.MONTHS.length).toBe(true);
    for (const a of m.MOCK_ACTIVITIES) expect(projects.some((p) => p.id === a.projectId)).toBe(true);
  });
  it("matches the specified progress values", async () => {
    const m = await import("@/data/project-dashboard-mock");
    expect(["p-1", "p-2", "p-3", "p-4", "p-5", "p-6"].map((id) => m.MOCK_PROJECTS[id].progress)).toEqual([65, 48, 72, 55, 60, 42]);
  });
});

describe("illustrative project economics series", () => {
  it("is deterministic, ends at the latest trend value, and covers every range", async () => {
    const { illustrativeSeries, illustrationRange } = await import("@/lib/project-illustration");
    const { MOCK_PROJECTS } = await import("@/data/project-dashboard-mock");
    const { RANGES } = await import("@/data/market-products");
    const trend = MOCK_PROJECTS["p-1"].trend;
    const a = illustrativeSeries("p-1", trend)!;
    const b = illustrativeSeries("p-1", trend)!;
    expect(a.daily.map((p) => p.price)).toEqual(b.daily.map((p) => p.price));
    expect(a.daily.at(-1)!.price).toBe(trend.at(-1));
    expect(a.intraday.at(-1)!.price).toBe(trend.at(-1));
    for (const r of RANGES) expect(illustrationRange(a, r).length).toBeGreaterThan(1);
    expect(illustrativeSeries("p-2", MOCK_PROJECTS["p-2"].trend)!.daily.map((p) => p.price)).not.toEqual(a.daily.map((p) => p.price));
    expect(illustrativeSeries("x", [])).toBeNull();
  });
});
