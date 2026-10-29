import type { CategoryId, Project } from "@/types";

/**
 * ILLUSTRATIVE MOCK DATA for the project dashboard. Every number here is made up for layout and demo
 * purposes: it is not a verified record, financial result, investor contribution or forecast.
 * It is kept apart from `projects.ts` (the catalogue) and is joined to projects by id at render time.
 * Set NEXT_PUBLIC_ILLUSTRATIVE_DATA=false to hide it; the dashboard then shows catalogue data only.
 */
export const ILLUSTRATIVE_DATA_ENABLED = process.env.NEXT_PUBLIC_ILLUSTRATIVE_DATA !== "false";
export const MOCK_LABEL = "Illustrative mock data — not actual financial records.";

export type MockStatus = "Active" | "Planning" | "Completed";
export type MockProject = {
  status: MockStatus;
  progress: number;
  budget: number;
  contributions: number;
  startDate: string;
  estimatedCompletionDate: string;
  /** Illustrative monthly activity index, May → October. */
  trend: number[];
  isMockData: true;
};

export const MONTHS = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"] as const;

const mp = (status: MockStatus, progress: number, budget: number, contributions: number, start: string, end: string, trend: number[]): MockProject => ({
  status, progress, budget, contributions, startDate: start, estimatedCompletionDate: end, trend, isMockData: true,
});

export const MOCK_PROJECTS: Record<string, MockProject> = {
  "p-1": mp("Active", 65, 300000, 90000, "2026-04-15", "2027-01-31", [8, 11, 12, 15, 18, 21]),
  "p-2": mp("Active", 48, 240000, 70000, "2026-05-01", "2027-03-31", [5, 7, 9, 11, 13, 16]),
  "p-3": mp("Active", 72, 400000, 110000, "2026-03-10", "2026-12-31", [9, 11, 13, 15, 17, 19]),
  "p-4": mp("Active", 55, 320000, 80000, "2026-04-01", "2027-02-28", [6, 8, 10, 12, 14, 15]),
  "p-5": mp("Active", 60, 280000, 85000, "2026-04-20", "2027-01-15", [5, 7, 9, 11, 12, 14]),
  "p-6": mp("Active", 42, 260000, 60000, "2026-06-01", "2027-04-30", [3, 5, 6, 8, 9, 11]),
  "p-7": mp("Completed", 100, 200000, 75000, "2026-02-01", "2026-09-30", [10, 13, 16, 18, 14, 8]),
  "p-8": mp("Active", 58, 250000, 70000, "2026-05-15", "2027-02-15", [6, 8, 10, 12, 13, 15]),
  "p-9": mp("Planning", 15, 180000, 45000, "2026-11-01", "2027-06-30", [1, 2, 3, 4, 6, 8]),
  "p-10": mp("Completed", 100, 150000, 40000, "2026-01-15", "2026-09-15", [7, 9, 12, 14, 10, 6]),
  "p-11": mp("Planning", 20, 220000, 65000, "2026-12-01", "2028-06-30", [1, 2, 2, 3, 5, 6]),
  "p-12": mp("Active", 38, 270000, 60000, "2026-06-15", "2027-06-30", [4, 5, 7, 8, 10, 12]),
};

/** Illustrative activity indices (not production or revenue), one series per category. */
export const MONTHLY_ACTIVITY: Record<CategoryId, number[]> = {
  crop_cultivation: [12, 16, 14, 20, 23, 26],
  dairy_farming: [8, 10, 12, 14, 16, 18],
  fish_farming: [6, 8, 9, 11, 13, 15],
  poultry_farming: [7, 9, 11, 12, 14, 15],
  biogas_composting: [4, 5, 7, 8, 9, 10],
  agri_forestry: [3, 4, 5, 7, 8, 10],
};

export type ActivityStatus = "Completed" | "In Progress" | "Scheduled";
export type MockActivity = { id: string; date: string; projectId: string; activity: string; status: ActivityStatus };

export const MOCK_ACTIVITIES: MockActivity[] = [
  { id: "a1", date: "2026-10-05", projectId: "p-1", activity: "Soil preparation", status: "Completed" },
  { id: "a2", date: "2026-10-08", projectId: "p-3", activity: "Feed management review", status: "In Progress" },
  { id: "a3", date: "2026-10-12", projectId: "p-5", activity: "Water quality monitoring", status: "Completed" },
  { id: "a4", date: "2026-10-16", projectId: "p-7", activity: "Poultry housing inspection", status: "Completed" },
  { id: "a5", date: "2026-10-20", projectId: "p-10", activity: "Compost processing", status: "In Progress" },
  { id: "a6", date: "2026-10-24", projectId: "p-12", activity: "Plantation maintenance", status: "In Progress" },
  { id: "a7", date: "2026-09-22", projectId: "p-2", activity: "Irrigation scheduling", status: "Completed" },
  { id: "a8", date: "2026-09-28", projectId: "p-4", activity: "Fodder plot preparation", status: "Completed" },
  { id: "a9", date: "2026-10-02", projectId: "p-6", activity: "Aeration system check", status: "Completed" },
  { id: "a10", date: "2026-10-14", projectId: "p-8", activity: "Egg collection process review", status: "Completed" },
  { id: "a11", date: "2026-10-18", projectId: "p-9", activity: "Waste collection planning", status: "Scheduled" },
  { id: "a12", date: "2026-10-26", projectId: "p-11", activity: "Site survey and layout", status: "Scheduled" },
  { id: "a13", date: "2026-09-10", projectId: "p-1", activity: "Seedbed layout", status: "Completed" },
  { id: "a14", date: "2026-09-18", projectId: "p-3", activity: "Shed hygiene audit", status: "Completed" },
  { id: "a15", date: "2026-09-25", projectId: "p-12", activity: "Soil conservation works", status: "Completed" },
];

/** Operational requirements per category (descriptive; no quantities). */
export const OPERATIONAL_REQUIREMENTS: Record<CategoryId, string[]> = {
  crop_cultivation: ["Access to suitable land and water", "Quality seed or planting material", "Organic inputs and soil testing", "Trained farm labour"],
  dairy_farming: ["Cattle housing with drainage and shade", "Reliable fodder and clean water", "Veterinary care arrangements", "Hygienic milk handling"],
  fish_farming: ["Ponds or tanks with controlled water supply", "Quality fish seed and feed", "Water testing equipment", "Aeration and harvest equipment"],
  poultry_farming: ["Ventilated, secure housing", "Feed and clean water supply", "Vaccination and health monitoring", "Biosecurity and waste handling"],
  biogas_composting: ["Suitable organic waste supply", "Digester or composting yard", "Safe gas handling or turning equipment", "Residue and compost storage"],
  agri_forestry: ["Land suited to chosen tree species", "Quality saplings", "Soil and water conservation measures", "Long-term maintenance plan"],
};

export const mockFor = (projectId: string): MockProject | null => (ILLUSTRATIVE_DATA_ENABLED ? MOCK_PROJECTS[projectId] ?? null : null);
export const activitiesFor = (projectId?: string) => (ILLUSTRATIVE_DATA_ENABLED ? MOCK_ACTIVITIES.filter((a) => !projectId || a.projectId === projectId) : []);

/** All summary-card values come from the project list + mock lookup, never separate hard-coded numbers. */
export function dashboardSummary(projects: Project[]) {
  const mocks = projects.map((p) => mockFor(p.id));
  const has = mocks.some(Boolean);
  return {
    total: projects.length,
    active: has ? mocks.filter((m) => m?.status === "Active").length : null,
    categories: new Set(projects.map((p) => p.category)).size,
    contributions: has ? mocks.reduce((s, m) => s + (m?.contributions ?? 0), 0) : null,
    illustrative: has,
  };
}
