import { ALL_STATES, districtsNamed } from "@/data/india-districts";
import type { Project } from "@/types";

/** The two macro-regions offered in Browse Projects. */
export type RegionId = "south" | "west";
/** Region filter value: "" means all regions. */
export type RegionFilter = RegionId | "";
export const REGIONS: { id: RegionId; label: string }[] = [
  { id: "south", label: "South India" },
  { id: "west", label: "Western India" },
];
export const ALL_REGIONS_LABEL = "All regions";
export const DEFAULT_REGION: RegionFilter = "";

/**
 * State → macro-region. Only states the application classifies appear here; every other state (including
 * Rajasthan) has no macro-region, so its projects show under "All regions" but under neither South nor Western India.
 */
const STATE_REGION: Record<string, RegionId> = {
  "Tamil Nadu": "south", Kerala: "south", Karnataka: "south", "Andhra Pradesh": "south", Telangana: "south",
  Maharashtra: "west", Gujarat: "west", Goa: "west",
};

type Located = Pick<Project, "location" | "region" | "district">;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Longest names first so "Dadra and Nagar Haveli and Daman and Diu" wins over shorter fragments.
const STATE_PATTERNS = [...ALL_STATES].sort((a, b) => b.length - a.length).map((s) => ({ s, re: new RegExp(`\\b${escape(s)}\\b`, "i") }));

/** The state named in the project's own location fields, or inferred from a district name that exists in only one state. */
export function stateOf(p: Located): string | null {
  const hay = `${p.region ?? ""} | ${p.location ?? ""}`;
  const hit = STATE_PATTERNS.find(({ re }) => re.test(hay));
  if (hit) return hit.s;
  const named = p.district ? districtsNamed(p.district) : [];
  return named.length === 1 ? named[0].state : null;
}

/** Macro-region from the project's location data. An explicit "South India"/"Western India" region value is honoured. */
export function regionOf(p: Located): RegionId | null {
  const r = (p.region ?? "").trim().toLowerCase();
  if (r === "south india") return "south";
  if (r === "western india") return "west";
  const s = stateOf(p);
  return s ? STATE_REGION[s] ?? null : null;
}

export const regionLabel = (id: RegionId) => REGIONS.find((r) => r.id === id)?.label ?? id;
