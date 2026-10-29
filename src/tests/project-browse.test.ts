import { describe, expect, it } from "vitest";
import { TN_DISTRICTS } from "@/config/demo-config";
import { createSeedState } from "@/data/seed";
import { activeExtraFilters, browse, clearMoreFilters, DEFAULT_FILTERS, DISTRICT_OPTIONS, districtKey, progressOf, revealProject, riskOf, statusOf } from "@/lib/project-browse";
import { publishedProjects } from "@/lib/project-helpers";
import { regionOf, REGIONS, stateOf } from "@/lib/regions";
import type { Project } from "@/types";

const catalogue = publishedProjects(createSeedState());
const f = (patch: Partial<typeof DEFAULT_FILTERS>) => ({ ...DEFAULT_FILTERS, ...patch });
const risk = (severity: "low" | "medium" | "high") => ({ id: severity, title: severity, severity, mitigation: "m" });

/** Located fixtures: the shipped catalogue has no districts, Western India projects, risks or varied durations. */
const mk = (id: string, patch: Partial<Project>): Project => ({ ...catalogue[0], id, title: `P ${id}`, ...patch });
const pool: Project[] = [
  mk("coimbatore", { region: "South India", location: "Pollachi, Tamil Nadu", district: "Coimbatore", stage: "growing", durationMonths: 3, risks: [risk("medium"), risk("medium")], category: "crop_cultivation" }),
  mk("madurai", { region: "Tamil Nadu", location: "Madurai", district: "Madurai", stage: "preparation", durationMonths: 6, risks: [risk("high"), risk("medium")] }),
  mk("kerala", { region: "Kerala", location: "Idukki, Kerala", district: "Idukki", stage: "harvest", durationMonths: 9, risks: [risk("low")] }),
  mk("nashik", { region: "Western India", location: "Nashik, Maharashtra", district: "Nashik", stage: "sales", durationMonths: 15, risks: [risk("high"), risk("high")] }),
  mk("goa", { region: "Goa", location: "Goa", district: "", stage: "closed", durationMonths: 0, risks: [] }),
  mk("jaipur", { region: "Rajasthan", location: "Jaipur, Rajasthan", district: "Jaipur", stage: "preparation" }),
];

describe("district dropdown (Tamil Nadu only)", () => {
  const names = DISTRICT_OPTIONS.map((o) => o.label);
  it("is exactly the 38 Tamil Nadu districts, alphabetical, no duplicates", () => {
    expect(names).toHaveLength(38);
    expect(new Set(names).size).toBe(38);
    expect(names).toEqual([...TN_DISTRICTS].sort((x, y) => x.localeCompare(y)));
    expect(DISTRICT_OPTIONS.every((o) => o.value === o.label)).toBe(true);
  });
  it("contains no district from any other state", () => {
    for (const other of ["Idukki", "Nashik", "Surat", "Jaipur", "Bengaluru Urban", "Hyderabad", "Thiruvananthapuram", "Leh"]) expect(names).not.toContain(other);
    for (const n of ["Ariyalur", "Coimbatore", "Chennai", "Virudhunagar"]) expect(names).toContain(n);
  });
  it("matches project districts despite spelling and formatting differences", () => {
    const d = (district: string) => districtKey(mk("x", { district, region: "Tamil Nadu" }));
    expect(d("coimbatore")).toBe("Coimbatore");
    expect(d("  MADURAI ")).toBe("Madurai");
    expect(d("The Nilgiris")).toBe("Nilgiris");
    expect(d("Kanyakumari")).toBe("Kanniyakumari");
    expect(d("Trichy")).toBe("Tiruchirappalli");
    expect(d("Salem District")).toBe("Salem");
    expect(d("Idukki")).toBe("");
    expect(districtKey(mk("y", { district: "Salem", region: "Kerala", location: "Kerala" }))).toBe("");
  });
});

describe("region mapping (from location data, never from names)", () => {
  it("offers South India and Western India (plus All regions in the UI), default all", () => {
    expect(REGIONS.map((r) => r.label)).toEqual(["South India", "Western India"]);
    expect(DEFAULT_FILTERS.region).toBe("");
  });
  it("maps states to macro-regions; Rajasthan and unknown locations have no region", () => {
    expect(regionOf(pool[0])).toBe("south");
    expect(regionOf(pool[1])).toBe("south");
    expect(regionOf(pool[2])).toBe("south");
    expect(regionOf(pool[3])).toBe("west");
    expect(regionOf(pool[4])).toBe("west");
    expect(regionOf(pool[5])).toBeNull();
    expect(regionOf({ region: "", location: "", district: "" })).toBeNull();
    expect(stateOf({ region: "", location: "", district: "Salem" })).toBe("Tamil Nadu");
    expect(stateOf({ region: "", location: "", district: "Bilaspur" })).toBeNull();
    expect(stateOf({ region: "Himachal Pradesh", location: "", district: "Bilaspur" })).toBe("Himachal Pradesh");
  });
});

describe("browse: search, category, sort", () => {
  it("defaults to all regions: all 12 catalogue projects; South shows them (Tamil Nadu); Western none", () => {
    expect(browse(catalogue, DEFAULT_FILTERS)).toHaveLength(12);
    expect(browse(catalogue, f({ region: "south" }))).toHaveLength(12);
    expect(browse(catalogue, f({ region: "west" }))).toHaveLength(0);
  });
  it("search is case-insensitive, trims, and matches crop, category and description", () => {
    expect(browse(catalogue, f({ q: "  DAIRY " })).length).toBeGreaterThanOrEqual(2);
    expect(browse(catalogue, f({ q: "orchard" })).map((p) => p.id)).toContain("p-2");
    expect(browse(catalogue, f({ q: "zzzz" }))).toHaveLength(0);
  });
  it("search, category and sort combine rather than overwrite", () => {
    const r = browse(catalogue, f({ q: "farm", category: "poultry_farming", sort: "name_desc" }));
    expect(r.every((p) => p.category === "poultry_farming")).toBe(true);
    expect(r.map((p) => p.title)).toEqual([...r.map((p) => p.title)].sort().reverse());
  });
  it("name and featured sorts work; funding sorts put projects without a target last", () => {
    const a = browse(catalogue, f({ sort: "name_asc" })).map((p) => p.title);
    expect(a).toEqual([...a].sort((x, y) => x.localeCompare(y)));
    expect(browse(catalogue, f({ sort: "featured" }))[0].featured).toBe(true);
    const funded = (id: string, raised: number | null) => mk(id, { funding: raised === null ? null : { target: 1000, raised } });
    const list = [funded("a", 100), funded("b", 600), funded("c", null)];
    expect(browse(list, f({ sort: "funding_desc" })).map((p) => p.id)).toEqual(["b", "a", "c"]);
    expect(browse(list, f({ sort: "funding_asc" })).map((p) => p.id)).toEqual(["a", "b", "c"]);
    expect(progressOf(list[2])).toBeNull();
    expect(statusOf(catalogue[0])).toBe("Enquiry only");
  });
});

describe("browse: the five More-filters dropdowns", () => {
  const ids = (patch: Partial<typeof DEFAULT_FILTERS>) => browse(pool, f(patch)).map((p) => p.id).sort();
  it("region: All shows everything (incl. unclassified Rajasthan); South and Western split", () => {
    expect(ids({})).toEqual(["coimbatore", "goa", "jaipur", "kerala", "madurai", "nashik"]);
    expect(ids({ region: "south" })).toEqual(["coimbatore", "kerala", "madurai"]);
    expect(ids({ region: "west" })).toEqual(["goa", "nashik"]);
  });
  it("district filters by Name, State and works with region", () => {
    expect(districtKey(pool[1])).toBe("Madurai");
    expect(ids({ district: "Madurai" })).toEqual(["madurai"]);
    expect(ids({ district: "Madurai", region: "south" })).toEqual(["madurai"]);
    expect(ids({ district: "Madurai", region: "west" })).toEqual([]); // district outside the region -> empty
    expect(ids({ district: "Chennai" })).toEqual([]); // supported district with no projects
  });
  it("stage uses the existing stage field", () => {
    expect(ids({ stage: "growing" })).toEqual(["coimbatore"]);
    expect(ids({ stage: "harvest" })).toEqual(["kerala"]);
    expect(ids({ stage: "closed" })).toEqual(["goa"]);
    expect(ids({ stage: "sales", region: "south" })).toEqual([]);
  });
  it("duration ranges; unknown durations only appear under Any", () => {
    expect(ids({ duration: "upto3" })).toEqual(["coimbatore", "jaipur"]);
    expect(ids({ duration: "upto6" })).toEqual(["coimbatore", "jaipur", "madurai"]);
    expect(ids({ duration: "7to12" })).toEqual(["kerala"]);
    expect(ids({ duration: "over12" })).toEqual(["nashik"]);
    expect(ids({})).toContain("goa");
  });
  it("risk label uses the demo method; projects with no listed risks are unlabelled, not Lower", () => {
    expect(riskOf(pool[0])).toBe("Moderate");
    expect(riskOf(pool[1])).toBe("Higher");
    expect(riskOf(pool[2])).toBe("Lower");
    expect(riskOf(pool[4])).toBeNull();
    expect(ids({ risk: "Lower" })).toEqual(["kerala"]);
    expect(ids({ risk: "Moderate" })).toEqual(["coimbatore"]);
    expect(ids({ risk: "Higher" })).toEqual(["madurai", "nashik"]);
    expect(browse(catalogue, f({ risk: "Lower" }))).toHaveLength(0);
  });
  it("all filters work cumulatively with search and category", () => {
    const all = { region: "south" as const, district: "Coimbatore", stage: "growing" as const, duration: "upto6", risk: "Moderate" as const };
    expect(ids(all)).toEqual(["coimbatore"]);
    expect(ids({ ...all, risk: "Higher" })).toEqual([]);
    expect(ids({ ...all, q: "zzz" })).toEqual([]);
    expect(ids({ ...all, category: "crop_cultivation" })).toEqual(["coimbatore"]);
  });
  it("clearMoreFilters restores defaults (Region -> All regions) but keeps search, category and sort", () => {
    const dirty = f({ q: "x", category: "fish_farming", sort: "name_desc", region: "west", stage: "growing", district: "Salem", duration: "upto3", risk: "Higher" });
    expect(activeExtraFilters(dirty)).toBe(5);
    expect(clearMoreFilters(dirty)).toEqual({ ...DEFAULT_FILTERS, q: "x", category: "fish_farming", sort: "name_desc" });
    expect(activeExtraFilters(DEFAULT_FILTERS)).toBe(0);
  });
});

describe("revealProject (Featured Projects navigation)", () => {
  const visible = (fl: typeof DEFAULT_FILTERS, id: string) => browse(pool, fl).some((p) => p.id === id);
  it("leaves filters alone when the project is already visible", () => {
    const fl = f({ q: "p " });
    expect(revealProject(pool, fl, "madurai")).toBe(fl);
  });
  it("clears only the single filter that hides the project, keeping the others and the sort", () => {
    const fl = f({ category: "fish_farming", stage: "harvest", sort: "name_desc" });
    expect(visible(fl, "kerala")).toBe(false); // category hides it
    const out = revealProject(pool, fl, "kerala");
    expect(visible(out, "kerala")).toBe(true);
    expect(out.stage).toBe("harvest");
    expect(out.sort).toBe("name_desc");
    expect(out.category).toBe("");
  });
  it("clears several filters only when one is not enough", () => {
    const fl = f({ q: "zzz", region: "west", stage: "harvest" });
    const out = revealProject(pool, fl, "kerala");
    expect(visible(out, "kerala")).toBe(true);
  });
  it("returns the filters unchanged for an unknown project id (never selects something else)", () => {
    const fl = f({ q: "zzz" });
    expect(revealProject(pool, fl, "nope")).toBe(fl);
  });
});
