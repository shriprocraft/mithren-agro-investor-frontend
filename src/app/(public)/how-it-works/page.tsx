import type { Metadata } from "next";
import { Callout, LinkButton } from "@/components/common/ui";
import { COPY } from "@/config/demo-config";

export const metadata: Metadata = { title: "How it works" };

const STEPS = [
  ["Explore", "Filter fictional projects by category, region, stage, duration and a demo risk label."],
  ["Understand the product", "See what is produced, the production cycle, the planned quantity and how each figure is evidenced."],
  ["Review the analysis", "Read costs, production and market assumptions, then compare downside, base and upside scenarios and adjust inputs yourself."],
  ["Understand what a payment represents", "In a live product the contract would state what you are entitled to. In this prototype the model is intentionally undecided, so no return is shown."],
  ["Enter an amount", "Rehearse a simulated amount — including ₹100 on projects configured for it. Limits and fees shown are illustrative."],
  ["Confirm (simulated)", "Acknowledge the risks and confirm. The demo records a simulated commitment; nothing is charged."],
  ["Track", "Follow your demo portfolio, estimated values, project updates and transactions."],
  ["Exit or withdraw (simulated)", "Request a simulated exit and a withdrawal. Both pass through review states, and pending proceeds are never counted as withdrawable cash."],
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-brand-900">How it works</h1>
      <p className="mt-2 text-muted">{COPY.demoLong}</p>
      <ol className="mt-8 space-y-4">
        {STEPS.map(([t, b], i) => (
          <li key={t} className="flex gap-4 rounded-card border border-line bg-white p-5 shadow-card">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{i + 1}</span>
            <div><h2 className="font-semibold text-brand-900">{t}</h2><p className="mt-1 text-sm text-muted">{b}</p></div>
          </li>
        ))}
      </ol>
      <Callout tone="warn" className="mt-8" title="Three different things — not to be confused">
        <ul className="list-disc pl-5">
          <li><strong>Withdraw available cash:</strong> request payout of settled demo cash.</li>
          <li><strong>Sell / redeem an investment:</strong> a simulated exit whose proceeds are pending until settled.</li>
          <li><strong>Liquidate everything then withdraw:</strong> each position must complete its own exit first; there is no one-click “withdraw all”.</li>
        </ul>
      </Callout>
      <div className="mt-8 flex gap-3"><LinkButton href="/projects">Browse projects</LinkButton><LinkButton href="/risk-disclosure" variant="secondary">Risk disclosure</LinkButton></div>
    </div>
  );
}
