/**
 * Contribution plan tiers. Amounts and timelines are fixed by the business.
 * No phase percentages exist in the application, so none are shown: add a `pct` field here
 * only when approved values are supplied. Nothing here is a guaranteed return, profit or interest.
 */
export type PlanPhase = { key: "start" | "use" | "end"; label: string; timeline: string };

export type ContributionPlan = {
  id: string;
  name: string;
  amount: number;
  phases: [PlanPhase, PlanPhase, PlanPhase];
};

const weeks = (a: number, b: number, c: number): ContributionPlan["phases"] => [
  { key: "start", label: "Start", timeline: `${a} Weeks` },
  { key: "use", label: "Utilization", timeline: `${b} Weeks` },
  { key: "end", label: "Completion", timeline: `${c} Weeks` },
];
const months = (a: number, b: number, c: number): ContributionPlan["phases"] => [
  { key: "start", label: "Start", timeline: `${a} Months` },
  { key: "use", label: "Utilization", timeline: `${b} Months` },
  { key: "end", label: "Completion", timeline: `${c} Months` },
];

export const CONTRIBUTION_PLANS: ContributionPlan[] = [
  { id: "starter", name: "Starter Plan", amount: 1000, phases: weeks(10, 12, 24) },
  { id: "growth", name: "Growth Plan", amount: 10000, phases: weeks(10, 12, 24) },
  { id: "farm-development", name: "Farm Development Plan", amount: 25000, phases: months(3, 6, 12) },
  { id: "premium-agriculture", name: "Premium Agriculture Plan", amount: 50000, phases: months(3, 6, 12) },
  { id: "enterprise-agriculture", name: "Enterprise Agriculture Plan", amount: 100000, phases: months(3, 6, 12) },
];
