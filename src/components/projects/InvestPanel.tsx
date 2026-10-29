"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDown, Bookmark } from "lucide-react";
import { Button, Callout } from "@/components/common/ui";
import { COPY } from "@/config/demo-config";
import { fundingProgress } from "@/lib/analysis-calculations";
import { cn } from "@/lib/cn";
import { formatINR } from "@/lib/format";
import { validateInvestmentAmount } from "@/lib/validation";
import type { Project, Role } from "@/types";

/** Fixed contribution choices offered in the dropdown. */
const AMOUNT_OPTIONS = [1000, 10000, 25000, 50000, 100000] as const;

const SHORT_PLAN = { start: "10 Weeks", use: "12 Weeks", end: "24 Weeks" };
const LONG_PLAN = { start: "3 Months", use: "6 Months", end: "12 Months" };
/** Plan stages per selectable amount, taken from the agriculture investment plan reference. */
const PLANS: Record<(typeof AMOUNT_OPTIONS)[number], { start: string; use: string; end: string }> = {
  1000: SHORT_PLAN, 10000: SHORT_PLAN, 25000: LONG_PLAN, 50000: LONG_PLAN, 100000: LONG_PLAN,
};

/**
 * Amount selector + summary + CTA for the selected project. It only validates and hands the amount to the existing
 * invest workflow (`/investor/invest/[id]`), which keeps its own review, acknowledgement and confirmation steps.
 * Mount with `key={project.id}` so the amount resets when the selection changes.
 */
export function InvestPanel({ project: p, role, isSaved, onToggleSave }: { project: Project; role: Role | null; isSaved: boolean; onToggleSave: () => void }) {
  const router = useRouter();
  const remaining = p.funding ? Math.max(0, p.funding.target - p.funding.raised) : null;
  const min = p.demoConfig.minAmount;
  const max = remaining === null ? p.demoConfig.maxAmount : Math.min(p.demoConfig.maxAmount, remaining);
  const fullyFunded = remaining === 0;
  const open = p.demoConfig.investable && !fullyFunded && max >= min;

  const [amount, setAmount] = useState<number>(AMOUNT_OPTIONS[0]);
  // Every option stays selectable; the project's own limits (min, max, remaining allocation) are still enforced.
  const v = validateInvestmentAmount(String(amount), { min, max: p.demoConfig.maxAmount, remainingAllocation: remaining });
  const error = !v.ok ? v.error : undefined;

  const invest = () => {
    if (!open || !v.ok) return;
    const target = `/investor/invest/${p.id}?amount=${v.value}`;
    router.push(role ? target : `/login?next=${encodeURIComponent(target)}`);
  };

  const blocked = !p.demoConfig.investable
    ? p.demoConfig.notInvestableReason ?? "This project is not open for demo investment."
    : fullyFunded ? "This project has reached its sample funding target." : !open ? "No investable allocation remains." : role && role !== "investor"
      ? `You are signed in as a demo ${role}. Switch to the investor demo role to invest.` : null;
  const planIndex = AMOUNT_OPTIONS.findIndex((n) => n === amount);
  const plan = PLANS[amount as keyof typeof PLANS];
  const stages = [["Start Plan", plan.start], ["Use Plan", plan.use], ["End Plan", plan.end]];
  const prog = fundingProgress(p.funding);

  return (
    <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-brand-50 px-5 py-3">
        <h2 className="text-sm font-bold text-ink">Invest in this project</h2>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", open ? "bg-ok-bg text-ok-fg" : "bg-neutral-bg text-neutral-fg")}>{open ? "Open for investment" : fullyFunded ? "Fully funded" : "Not open"}</span>
      </div>
      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs font-semibold text-ink">Investment type</p>
          <div className="mt-1.5"><span className="inline-flex min-h-9 items-center rounded-control border border-brand-600 bg-brand-100 px-3 text-xs font-semibold text-brand-800">One-time</span></div>
          <p className="mt-1 text-xs text-muted">One-time is the only structure supported in this prototype.</p>
        </div>

        <div>
          <label htmlFor="invest-amount" className="text-xs font-semibold text-ink">Investment Amount (₹)</label>
          <select id="invest-amount" value={amount} onChange={(e) => setAmount(Number(e.target.value))} aria-invalid={open && error ? true : undefined} aria-describedby={open && error ? "invest-amount-err" : undefined}
            className={cn("mt-1.5 min-h-11 w-full rounded-control border bg-white px-3 text-base font-semibold text-ink focus:border-brand-600 focus-visible:outline-2 focus-visible:outline-brand-600", open && error ? "border-bad-fg" : "border-line")}>
            {AMOUNT_OPTIONS.map((n) => <option key={n} value={n}>{formatINR(n)}</option>)}
          </select>
          {open && error && <p id="invest-amount-err" role="alert" className="mt-1.5 text-xs font-semibold text-bad-fg">{error}</p>}
        </div>

        <div className="rounded-control border border-brand-600 bg-brand-50 p-3" aria-live="polite">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white">Plan {planIndex + 1}</span>
            <span className="text-xs font-semibold text-muted">Selected amount</span>
          </div>
          <p className="tabular mt-2 text-2xl font-bold text-ink">{formatINR(amount)}</p>
          <ol className="mt-3">
            {stages.map(([label, value], i) => (
              <li key={label}>
                <div className="flex items-center justify-between gap-3 rounded-control border border-brand-600 bg-white px-3 py-2 text-sm">
                  <span className="font-semibold text-brand-800">{label}</span>
                  <span className="tabular font-bold text-ink">{value}</span>
                </div>
                {i < stages.length - 1 && <ArrowDown className="mx-auto my-1 size-4 text-brand-600" aria-hidden />}
              </li>
            ))}
          </ol>
        </div>
        <p className="text-xs text-muted">{COPY.projectNotReturn}</p>

        <Button className="w-full" disabled={!open || !v.ok || (role !== null && role !== "investor")} onClick={invest}>Invest in This Project</Button>
        {blocked ? <p className="text-xs text-muted">{blocked}</p> : !role && open && <p className="text-xs text-muted">You will be asked to log in, then return to review this amount.</p>}
        {prog !== null && <p className="tabular text-xs text-muted">{prog}% of the sample target is already funded.</p>}

        <Button variant="secondary" className="w-full" aria-pressed={isSaved} onClick={onToggleSave}><Bookmark className={cn("size-4", isSaved && "fill-brand-600 text-brand-600")} aria-hidden /> {isSaved ? "Saved to watchlist" : "Add to watchlist"}</Button>
      </div>
      <div className="border-t border-line p-4">
        <Callout tone="neutral" title="Returns are not guaranteed">Demo only — no real payment is taken. {COPY.noGuarantee} <Link href="/risk-disclosure" className="font-semibold underline">Risk disclosure</Link></Callout>
      </div>
    </div>
  );
}
