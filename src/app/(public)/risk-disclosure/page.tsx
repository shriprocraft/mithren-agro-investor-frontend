import type { Metadata } from "next";
import { Callout } from "@/components/common/ui";
import { COPY } from "@/config/demo-config";

export const metadata: Metadata = { title: "Risk disclosure" };

const RISKS = [
  ["Production risk", "Weather, disease, pests, mortality and equipment failure can reduce or destroy output."],
  ["Market risk", "Selling prices, demand and buyer behaviour can change. A price evidence date is not a promise of a future price."],
  ["Cost risk", "Input, labour, energy and transport costs can rise above budget."],
  ["Counterparty and delay risk", "Buyers can pay late or not at all; milestones can slip."],
  ["Project completion risk", "A project can be suspended, reduced or cancelled."],
  ["Liquidity risk", "Exit, redemption or withdrawal may be delayed, limited or unavailable. The demo shows simulated flows only; a live product may have no exit."],
  ["Information risk", "Operator-provided figures are not independently verified. Evidence labels describe the level of checking actually performed."],
  ["Model risk", "Scenario outputs are illustrative estimates, not forecasts or probabilities."],
];

export default function RiskDisclosurePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-brand-900">Risk disclosure</h1>
      <Callout tone="neutral" className="mt-4" title="Placeholder language">This is provisional prototype copy, not approved legal wording. {COPY.noGuarantee} {COPY.projectNotReturn}</Callout>
      <ul className="mt-6 space-y-3">
        {RISKS.map(([t, b]) => (<li key={t} className="rounded-card border border-line bg-white p-5 shadow-card"><h2 className="font-semibold text-brand-900">{t}</h2><p className="mt-1 text-sm text-muted">{b}</p></li>))}
      </ul>
      <p className="mt-6 text-sm text-muted">You could lose some or all of an amount committed in a real product. Nothing on this site is a guarantee of returns, capital protection, buyback or instant cash.</p>
    </div>
  );
}
