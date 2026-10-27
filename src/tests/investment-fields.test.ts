import { describe, expect, it } from "vitest";
import { CATEGORIES, TN_DISTRICTS } from "@/config/demo-config";
import { createSeedState } from "@/data/seed";
import { projectCompleteness, saveProjectDraft } from "@/lib/mock-service";
import { normalizeProject } from "@/lib/project-helpers";
import type { Project } from "@/types";

const owner = { id: "owner-1", name: "Meera", role: "owner" as const };
const base = (): Project => ({ ...createSeedState().projects[0], status: "draft", district: "Madurai", durationMonths: 2 });

describe("categories, district and duration", () => {
  it("exposes exactly six categories and 38 unique districts", () => {
    expect(CATEGORIES.map((c) => c.label)).toEqual(["Crop Cultivation", "Dairy Farming", "Fish Farming", "Poultry Farming", "Biogas & Composting", "Agri Forestry"]);
    expect(new Set(TN_DISTRICTS).size).toBe(38);
  });
  it("rejects durations above 3 months, below 1, or fractional", () => {
    for (const d of [4, 6, 12, 0, 1.5]) expect(saveProjectDraft(createSeedState(), { ...base(), id: "new", durationMonths: d }, owner).ok).toBe(false);
    for (const d of [1, 2, 3]) expect(saveProjectDraft(createSeedState(), { ...base(), id: "new", durationMonths: d }, owner).ok).toBe(true);
  });
  it("rejects unknown categories and districts", () => {
    expect(saveProjectDraft(createSeedState(), { ...base(), id: "new", category: "vegetables" as never }, owner).ok).toBe(false);
    expect(saveProjectDraft(createSeedState(), { ...base(), id: "new", district: "Pune" }, owner).ok).toBe(false);
    expect(projectCompleteness({ ...base(), district: "" })).toContain("Select a Tamil Nadu district.");
  });
  it("migrates legacy records", () => {
    const m = normalizeProject({ ...base(), category: "aquaculture" as never, durationMonths: 12, district: undefined as never });
    expect([m.category, m.durationMonths, m.district]).toEqual(["fish_farming", 3, ""]);
  });
});
