import { categoryLabel, STAGE_LABEL, TN_DISTRICTS } from "@/config/demo-config";
import { fundingProgress } from "@/lib/analysis-calculations";
import { riskLabel } from "@/lib/project-helpers";
import { DEFAULT_REGION, regionOf, stateOf, type RegionFilter } from "@/lib/regions";
import type { CategoryId, Project, ProjectStage } from "@/types";

export type SortKey = "featured" | "newest" | "oldest" | "funding_desc" | "funding_asc" | "name_asc" | "name_desc";
export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "funding_desc", label: "Funding Progress: High to Low" },
  { value: "funding_asc", label: "Funding Progress: Low to High" },
  { value: "name_asc", label: "Project Name: A–Z" },
  { value: "name_desc", label: "Project Name: Z–A" },
];

export type RiskFilter = "" | "Lower" | "Moderate" | "Higher";
export type BrowseFilters = {
  q: string;
  category: CategoryId | "";
  sort: SortKey;
  region: RegionFilter;
  stage: ProjectStage | "";
  /** Canonical Tamil Nadu district name. "" = all districts. */
  district: string;
  duration: string;
  risk: RiskFilter;
};
export const DEFAULT_FILTERS: BrowseFilters = { q: "", category: "", sort: "featured", region: DEFAULT_REGION, stage: "", district: "", duration: "", risk: "" };
/** The five More-filters dropdowns reset to their defaults; search, category and sort are left alone. */
export const clearMoreFilters = (f: BrowseFilters): BrowseFilters => ({ ...f, region: DEFAULT_REGION, stage: "", district: "", duration: "", risk: "" });

export const STAGE_OPTIONS = (Object.entries(STAGE_LABEL) as [ProjectStage, string][]).map(([value, label]) => ({ value, label }));

export const DURATION_OPTIONS: { value: string; label: string; match: (m: number) => boolean }[] = [
  { value: "upto3", label: "Up to 3 months", match: (m) => m > 0 && m <= 3 },
  { value: "upto6", label: "Up to 6 months", match: (m) => m > 0 && m <= 6 },
  { value: "7to12", label: "7–12 months", match: (m) => m >= 7 && m <= 12 },
  { value: "over12", label: "Over 12 months", match: (m) => m > 12 },
];
export const RISK_OPTIONS: RiskFilter[] = ["Lower", "Moderate", "Higher"];

/** Funding progress 0–100, or null when the project has no funding target (never invented). */
export const progressOf = (p: Project) => fundingProgress(p.funding);

/** Status derived only from existing fields: completion, funding and the investable flag. */
export function statusOf(p: Project): string {
  if (p.status === "completed_demo") return "Completed";
  const pct = progressOf(p);
  if (pct !== null && pct >= 100) return "Fully Funded";
  if (p.demoConfig.investable) return pct !== null && pct > 0 ? "Funding in Progress" : "Open";
  return "Enquiry only";
}

/**
 * Demo-method risk label (see RISK_METHOD). A project with no listed risks has NO label (null):
 * an empty list is missing data, not evidence of low risk.
 */
export const riskOf = (p: Project): Exclude<RiskFilter, ""> | null => (p.risks.length === 0 ? null : riskLabel(p));

/** Lower-case, strip punctuation and collapse spaces so "  the Nilgiris " and "nilgiris" compare equal. */
const norm = (v: string) => v.toLowerCase().replace(/\b(district|dist)\b/g, " ").replace(/[^a-z0-9]+/g, " ").replace(/^the /, "").trim();

/** Alternative spellings seen in practice → canonical TN_DISTRICTS name. */
const ALIASES: Record<string, string> = {
  kanchipuram: "Kancheepuram", kanyakumari: "Kanniyakumari", kanniyakumari: "Kanniyakumari", trichy: "Tiruchirappalli", tiruchirapalli: "Tiruchirappalli", trichirappalli: "Tiruchirappalli",
  tuticorin: "Thoothukudi", villupuram: "Viluppuram", tirupattur: "Tirupathur", pudukkotai: "Pudukkottai", tirunelvelli: "Tirunelveli", thiruvallur: "Tiruvallur",
  thiruvarur: "Tiruvarur", thiruvannamalai: "Tiruvannamalai", tanjore: "Thanjavur", tanjavur: "Thanjavur", nilgiri: "Nilgiris", ooty: "Nilgiris",
};
const CANONICAL = new Map<string, string>([...TN_DISTRICTS.map((d) => [norm(d), d] as const), ...Object.entries(ALIASES)]);

/** Canonical Tamil Nadu district for a project, or "" when it has no (recognised) Tamil Nadu district. */
export function districtKey(p: Project): string {
  if (!p.district) return "";
  const state = stateOf(p);
  if (state && state !== "Tamil Nadu") return "";
  return CANONICAL.get(norm(p.district)) ?? "";
}

/** District dropdown: exactly the 38 Tamil Nadu districts, alphabetical. No other state's districts, nothing derived from project data. */
export const DISTRICT_OPTIONS: { value: string; label: string }[] = [...new Set(TN_DISTRICTS)]
  .sort((x, y) => x.localeCompare(y))
  .map((d) => ({ value: d, label: d }));

export function matchesQuery(p: Project, q: string) {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  return [p.title, categoryLabel(p.category), p.crop, p.location, p.district, p.region, p.summary, p.fullDescription ?? ""].join(" ").toLowerCase().includes(t);
}

/** Search → category → region → district → stage → duration → risk. Every active condition must hold; "" means no restriction. */
export function filterProjects(projects: Project[], f: BrowseFilters): Project[] {
  const dur = DURATION_OPTIONS.find((d) => d.value === f.duration);
  return projects.filter((p) => {
    if (!matchesQuery(p, f.q)) return false;
    if (f.category && p.category !== f.category) return false;
    if (f.region && regionOf(p) !== f.region) return false;
    if (f.district && districtKey(p) !== f.district) return false;
    if (f.stage && p.stage !== f.stage) return false;
    if (dur && !(Number.isFinite(p.durationMonths) && dur.match(p.durationMonths))) return false;
    if (f.risk && riskOf(p) !== f.risk) return false;
    return true;
  });
}

/** Stable sort; projects missing the sort field go last, ties fall back to name. */
export function sortProjects(projects: Project[], sort: SortKey): Project[] {
  const byName = (a: Project, b: Project) => a.title.localeCompare(b.title);
  const date = (p: Project) => Date.parse(p.createdAt) || null;
  const num = (get: (p: Project) => number | null, dir: 1 | -1) => (a: Project, b: Project) => {
    const x = get(a), y = get(b);
    if (x === null && y === null) return byName(a, b);
    if (x === null) return 1;
    if (y === null) return -1;
    return (x - y) * dir || byName(a, b);
  };
  const cmp: Record<SortKey, (a: Project, b: Project) => number> = {
    featured: (a, b) => Number(b.featured) - Number(a.featured) || byName(a, b),
    newest: num(date, -1),
    oldest: num(date, 1),
    funding_desc: num(progressOf, -1),
    funding_asc: num(progressOf, 1),
    name_asc: byName,
    name_desc: (a, b) => byName(b, a),
  };
  return [...projects].sort(cmp[sort]);
}

export const browse = (projects: Project[], f: BrowseFilters) => sortProjects(filterProjects(projects, f), f.sort);

/** How many of the five dropdowns differ from their defaults. */
export const activeExtraFilters = (f: BrowseFilters) =>
  [!!f.region, !!f.stage, !!f.district, !!f.duration, !!f.risk].filter(Boolean).length;

export const durationText = (m: number) => `${m} ${m === 1 ? "Month" : "Months"}`;

const RESETTABLE = ["q", "category", "region", "district", "stage", "duration", "risk"] as const;

/**
 * Adjust filters only as much as needed for `projectId` to appear in the results (used when arriving from a
 * Featured Projects link). Tries clearing one filter at a time first, then clears cumulatively. Sorting is never touched.
 */
export function revealProject(projects: Project[], f: BrowseFilters, projectId: string): BrowseFilters {
  const visible = (x: BrowseFilters) => filterProjects(projects, x).some((p) => p.id === projectId);
  if (visible(f) || !projects.some((p) => p.id === projectId)) return f;
  for (const k of RESETTABLE) {
    const next = { ...f, [k]: DEFAULT_FILTERS[k] };
    if (visible(next)) return next;
  }
  let cur = f;
  for (const k of RESETTABLE) {
    cur = { ...cur, [k]: DEFAULT_FILTERS[k] };
    if (visible(cur)) return cur;
  }
  return cur;
}
