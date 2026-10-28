"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Bookmark, Minus, Plus } from "lucide-react";
import { Button, Callout } from "@/components/common/ui";
import { COPY, durationLabel } from "@/config/demo-config";
import { fundingProgress } from "@/lib/analysis-calculations";
import { cn } from "@/lib/cn";
import { formatINR, formatPercent } from "@/lib/format";
import { validateInvestmentAmount } from "@/lib/validation";
import type { Project, Role } from "@/types";

/** Slider step that keeps ~100 positions across the allowed range. */
const stepFor = (range: number) => (range <= 200 ? 1 : 10 ** Math.floor(Math.log10(range / 100)));

/**
 * Amount selector + summary + CTA for the selected project. It only validates and hands the amount to the existing
 * invest workflow (`/investor/invest/[id]`), which keeps its own review, acknowledgement and confirmation steps.
 * Mount with `key={project.id}` so the amount resets when the selection changes.
 */
export function InvestPanel({ project: p, role, isSaved, onToggleSave }: { project: Project; role: Role | null; isSaved: boolean; onToggleSave: () => void }) {
  const router = useRouter();
  const inputId = useId();
  const errId = useId();
  const remaining = p.funding ? Math.max(0, p.funding.target - p.funding.raised) : null;
  const min = p.demoConfig.minAmount;
  const max = remaining === null ? p.demoConfig.maxAmount : Math.min(p.demoConfig.maxAmount, remaining);
  const fullyFunded = remaining === 0;
  const open = p.demoConfig.investable && !fullyFunded && max >= min;
  const step = stepFor(max - min);

  const [raw, setRaw] = useState(String(min));
  const [touched, setTouched] = useState(false);
  const v = validateInvestmentAmount(raw, { min, max: p.demoConfig.maxAmount, remainingAllocation: remaining });
  const error = touched && !v.ok ? v.error : undefined;
  const amount = v.ok ? v.value : null;
  const sliderValue = Math.min(max, Math.max(min, amount ?? min));
  const nudge = (dir: 1 | -1) => {
    setTouched(true);
    const next = Math.min(max, Math.max(min, (amount ?? min) + dir * step));
    setRaw(String(next));
  };

  const invest = () => {
    setTouched(true);
    if (!open || !v.ok) return;
    const target = `/investor/invest/${p.id}?amount=${v.value}`;
    router.push(role ? target : `/login?next=${encodeURIComponent(target)}`);
  };

  const blocked = !p.demoConfig.investable
    ? p.demoConfig.notInvestableReason ?? "This project is not open for demo investment."
    : fullyFunded ? "This project has reached its sample funding target." : !open ? "No investable allocation remains." : role && role !== "investor"
      ? `You are signed in as a demo ${role}. Switch to the investor demo role to invest.` : null;
  const share = amount !== null && p.funding && p.funding.target > 0 ? (amount / p.funding.target) * 100 : null;
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
          <label htmlFor={inputId} className="text-xs font-semibold text-ink">Investment amount (₹)</label>
          <div className="mt-1.5 flex items-stretch gap-2">
            <div className={cn("flex min-w-0 flex-1 items-center rounded-control border bg-white px-3", error ? "border-bad-fg" : "border-line focus-within:border-brand-600")}>
              <span className="text-lg font-semibold text-muted" aria-hidden>₹</span>
              <input id={inputId} inputMode="decimal" autoComplete="off" disabled={!open} value={raw} onChange={(e) => setRaw(e.target.value)} onBlur={() => setTouched(true)} aria-invalid={error ? true : undefined} aria-describedby={error ? errId : undefined} className="tabular min-h-11 w-full min-w-0 bg-transparent px-2 text-xl font-bold text-ink outline-none disabled:text-muted" />
            </div>
            <Button variant="secondary" className="px-3" aria-label={`Decrease amount by ${formatINR(step)}`} disabled={!open || (amount ?? min) <= min} onClick={() => nudge(-1)}><Minus className="size-4" aria-hidden /></Button>
            <Button variant="secondary" className="px-3" aria-label={`Increase amount by ${formatINR(step)}`} disabled={!open || (amount ?? min) >= max} onClick={() => nudge(1)}><Plus className="size-4" aria-hidden /></Button>
          </div>
          {error && <p id={errId} role="alert" className="mt-1.5 text-xs font-semibold text-bad-fg">{error}</p>}
          <input type="range" aria-label="Investment amount slider" min={min} max={Math.max(min, max)} step={step} value={sliderValue} disabled={!open || min === max} onChange={(e) => { setRaw(e.target.value); setTouched(true); }} className="mt-3 h-2 w-full accent-brand-600" />
          <div className="tabular flex justify-between text-xs text-muted"><span>{formatINR(min)} min</span><span>{formatINR(Math.max(min, max))} max</span></div>
        </div>

        <dl className="divide-y divide-line rounded-control border border-line text-sm">
          {[
            ["Selected amount", amount === null ? "—" : formatINR(amount)],
            ["Share of funding target", share === null ? "—" : `${formatPercent(share, share < 1 ? 2 : 1)} of sample target`],
            ["Investment period", durationLabel(p.durationMonths)],
            ["Fees", "None configured in the demo"],
            ["Projected outcome", "Not calculated — investor return model is undecided"],
          ].map(([k, val]) => (
            <div key={k} className="flex justify-between gap-3 px-3 py-2"><dt className="text-muted">{k}</dt><dd className="tabular text-right font-semibold text-ink">{val}</dd></div>
          ))}
        </dl>
        <p className="text-xs text-muted">Share of target is a funding ratio, not a legal ownership stake. {COPY.projectNotReturn}</p>

        <Button className="w-full" disabled={!open || (role !== null && role !== "investor")} onClick={invest}>Invest in This Project</Button>
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
