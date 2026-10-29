"use client";

import { useState } from "react";
import { ArrowDown, Flag, Gift, PlayCircle, Sprout, Wheat } from "lucide-react";
import { Button } from "@/components/common/ui";
import { EnquiryModal, type EnquiryPrefill } from "@/components/plans/EnquiryModal";
import { CONTRIBUTION_PLANS, type PlanPhase } from "@/data/contribution-plans";
import { formatINR } from "@/lib/format";

const PHASE_ICON: Record<PlanPhase["key"], typeof PlayCircle> = { start: PlayCircle, use: Wheat, end: Flag };

export function ContributionPlans() {
  const [prefill, setPrefill] = useState<EnquiryPrefill | null>(null);
  return (
    <section aria-labelledby="plans-heading" className="space-y-6">
      <div className="text-center">
        <h2 id="plans-heading" className="text-2xl font-bold uppercase tracking-wide text-brand-900 sm:text-3xl">Choose your contribution plan</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted sm:text-base">Select the Right Plan to Support Sustainable Agriculture and Rural Development.</p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {CONTRIBUTION_PLANS.map((plan) => (
          <li key={plan.id} className="flex">
            <article className="group flex w-full flex-col overflow-hidden rounded-card border border-line bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-hover">
              <header className="flex min-h-28 flex-col items-center justify-center bg-white px-4 py-4 text-center">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">{plan.name}</h3>
                <p className="tabular mt-2 text-3xl font-bold text-brand-800">{formatINR(plan.amount)}</p>
              </header>
              <ol className="flex flex-1 flex-col items-stretch gap-1 bg-earth-50 p-4" aria-label={`${plan.name} phases`}>
                {plan.phases.map((ph, idx) => {
                  const Icon = PHASE_ICON[ph.key];
                  return (
                    <li key={ph.key} className="flex flex-col items-center">
                      <div className="flex w-full items-center gap-3 rounded-control border border-line bg-white px-3 py-2">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700"><Icon className="size-5" aria-hidden /></span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Phase {idx + 1} — {ph.label}</p>
                          <p className="text-sm font-bold text-brand-900">Timeline: {ph.timeline}</p>
                        </div>
                      </div>
                      {idx < 2 && <ArrowDown className="my-1 size-4 text-brand-600" aria-hidden />}
                    </li>
                  );
                })}
              </ol>
              <footer className="border-t border-line p-4">
                <Button className="w-full" variant="primary" onClick={() => setPrefill({ planId: plan.id, amount: plan.amount, heading: `${plan.name} — ${formatINR(plan.amount)}` })} aria-label={`Enquire about the ${plan.name}, ${formatINR(plan.amount)}`}>
                  Enquire about this plan
                </Button>
              </footer>
            </article>
          </li>
        ))}
      </ul>
      <p className="text-center text-xs text-muted">Contribution amounts are not guaranteed returns, profit or interest. Timelines describe plan phases only.</p>

      <div className="flex flex-col items-center gap-4 rounded-card border border-line bg-brand-50 p-6 text-center sm:flex-row sm:text-left">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-brand-700 shadow-card"><Gift className="size-6" aria-hidden /></span>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-brand-900">Flexible Contribution Options Available</h3>
          <p className="mt-1 text-sm text-muted">Explore contribution options designed to support agricultural projects of different scales.</p>
        </div>
        <Button onClick={() => setPrefill({ heading: "Tell us about the contribution you have in mind." })}><Sprout className="size-4" aria-hidden /> Explore Custom Plans</Button>
      </div>

      <EnquiryModal open={prefill !== null} onClose={() => setPrefill(null)} prefill={prefill ?? {}} />
    </section>
  );
}
