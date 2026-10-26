import type { DemoState, Project } from "@/types";

export type Completeness = "full" | "limited" | "none";

export function analysisCompleteness(p: Project): Completeness {
  if (!p.analysis) return "none";
  if (p.analysis.pricePerUnit === null || p.analysis.salesDeductionPct === null || p.analysis.costs.length === 0) return "limited";
  return "full";
}

export const COMPLETENESS_LABEL: Record<Completeness, string> = {
  full: "Full analysis submitted",
  limited: "Limited analysis",
  none: "Analysis not available",
};

/**
 * DEMO risk-label method (documented, not an approved scoring methodology):
 * owner-listed risks score high=2, medium=1, low=0. Total ≥3 → Higher, 2 → Moderate, else Lower.
 */
export const RISK_METHOD =
  "Demo method: each risk listed by the owner scores high = 2, medium = 1, low = 0. A total of 3 or more is labelled “Higher”, 2 is “Moderate”, otherwise “Lower”. This is not an approved scoring methodology and is not a prediction.";

export function riskLabel(p: Project): "Higher" | "Moderate" | "Lower" {
  const pts = p.risks.reduce((s, r) => s + (r.severity === "high" ? 2 : r.severity === "medium" ? 1 : 0), 0);
  return pts >= 3 ? "Higher" : pts === 2 ? "Moderate" : "Lower";
}

/** Publicly listed projects: approved/active/completed only. Drafts and reviews stay private. */
export const isPublished = (p: Project) => ["approved_demo", "active_demo", "completed_demo"].includes(p.status);

export const publishedProjects = (s: DemoState) => s.projects.filter(isPublished);

export const projectById = (s: DemoState, id: string) => s.projects.find((p) => p.id === id);

export function durationBucket(months: number): "short" | "medium" | "long" {
  return months <= 6 ? "short" : months <= 12 ? "medium" : "long";
}
