"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bookmark, Info, Minus, Plus } from "lucide-react";
import { Modal } from "@/components/common/feedback";
import { Button, Callout } from "@/components/common/ui";
import { categoryLabel, COPY } from "@/config/demo-config";
import { fundingProgress } from "@/lib/analysis-calculations";
import { cn } from "@/lib/cn";
import { formatDate, formatINR } from "@/lib/format";
import { DEFAULT_FREQUENCY, durationLabel, FREQUENCIES, frequencyOf, validateDuration, type Frequency } from "@/lib/investment-schedule";
import { validateInvestmentAmount } from "@/lib/validation";
import type { Project, Role } from "@/types";

/** Fixed contribution choices offered in the dropdown. */
const AMOUNT_OPTIONS = [1000, 10000, 25000, 50000, 100000] as const;

/** What the panel hands to the enquiry form when the project only accepts contribution enquiries. */
export type InvestSelection = { amount: number; frequency: Frequency; duration: number };

/**
 * Amount, frequency and duration selector with a review dialog. Reviewing never creates an investment: projects open
 * for demo investment continue to the existing invest workflow (`/investor/invest/[id]`); enquiry-only projects
 * continue to the existing contribution enquiry form. Mount with `key={project.id}` so selections reset per project.
 */
export function InvestPanel({ project: p, role, isSaved, onToggleSave, onEnquire }: {
  project: Project; role: Role | null; isSaved: boolean; onToggleSave: () => void; onEnquire: (s: InvestSelection) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState(false);
  const remaining = p.funding ? Math.max(0, p.funding.target - p.funding.raised) : null;
  const fullyFunded = remaining === 0;
  const investable = p.demoConfig.investable && !fullyFunded && (remaining === null || remaining >= p.demoConfig.minAmount);

  const [amount, setAmount] = useState<number>(AMOUNT_OPTIONS[0]);
  const [frequency, setFrequency] = useState<Frequency>(DEFAULT_FREQUENCY);
  const [rawDuration, setRawDuration] = useState(String(frequencyOf(DEFAULT_FREQUENCY).min));
  const [durationTouched, setDurationTouched] = useState(false);

  const freq = frequencyOf(frequency);
  // Every option stays selectable; the project's own limits (min, max, remaining allocation) are still enforced.
  const v = validateInvestmentAmount(String(amount), { min: p.demoConfig.minAmount, max: p.demoConfig.maxAmount, remainingAllocation: remaining });
  const d = validateDuration(rawDuration, frequency);
  const amountError = v.ok ? undefined : v.error;
  const durationError = !d.ok && durationTouched ? d.error : undefined;
  const wrongRole = role !== null && role !== "investor";
  const ready = v.ok && d.ok && !wrongRole;

  const pickFrequency = (id: Frequency) => {
    if (id === frequency) return;
    setFrequency(id);
    setRawDuration(String(frequencyOf(id).min)); // weeks and months are different units, so restart at the new minimum
    setDurationTouched(false);
  };
  const step = (dir: 1 | -1) => {
    const cur = d.ok ? d.value : freq.min;
    setRawDuration(String(Math.max(freq.min, cur + dir)));
    setDurationTouched(true);
  };

  const proceed = () => {
    if (!v.ok || !d.ok) return;
    if (!investable) { setReview(false); onEnquire({ amount: v.value, frequency, duration: d.value }); return; }
    setBusy(true);
    const target = `/investor/invest/${p.id}?amount=${v.value}`;
    router.push(role ? target : `/login?next=${encodeURIComponent(target)}`);
  };

  const status = investable ? "Open for investment" : fullyFunded ? "Fully funded" : "Enquiry only";
  const note = wrongRole
    ? `You are signed in as a demo ${role}. Switch to the investor demo role to invest.`
    : !investable ? (fullyFunded ? "This project has reached its sample funding target." : p.demoConfig.notInvestableReason ?? "This project is not open for demo investment.") : null;
  const prog = fundingProgress(p.funding);
  const seg = (on: boolean) => cn("min-h-11 rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600", on ? "bg-brand-600 text-white shadow-sm" : "text-ink hover:bg-brand-50");
  const summary: [string, string][] = [
    ["Investment amount", formatINR(amount)],
    ["Frequency", freq.label],
    ["Duration", d.ok ? durationLabel(frequency, d.value) : "—"],
  ];

  return (
    <div className="overflow-hidden rounded-card border border-line bg-white shadow-card">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-brand-50 px-5 py-3">
        <h2 className="text-sm font-bold text-ink">Invest in this project</h2>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", investable ? "bg-ok-bg text-ok-fg" : "bg-neutral-bg text-neutral-fg")}>{status}</span>
      </div>
      <div className="space-y-4 p-5">
        <div>
          <label htmlFor="invest-amount" className="text-xs font-semibold text-ink">Investment Amount (₹)</label>
          <select id="invest-amount" value={amount} onChange={(e) => setAmount(Number(e.target.value))} aria-invalid={amountError ? true : undefined} aria-describedby={amountError ? "invest-amount-err" : undefined}
            className={cn("mt-1.5 min-h-11 w-full rounded-control border bg-white px-3 text-base font-semibold text-ink focus:border-brand-600 focus-visible:outline-2 focus-visible:outline-brand-600", amountError ? "border-bad-fg" : "border-line")}>
            {AMOUNT_OPTIONS.map((n) => <option key={n} value={n}>{formatINR(n)}</option>)}
          </select>
          {amountError && <p id="invest-amount-err" role="alert" className="mt-1.5 text-xs font-semibold text-bad-fg">{amountError}</p>}
        </div>

        <fieldset>
          <legend className="text-xs font-semibold text-ink">Investment frequency</legend>
          <div role="radiogroup" aria-label="Investment frequency" className="mt-1.5 grid grid-cols-2 gap-1 rounded-full border border-line bg-earth-50 p-1">
            {FREQUENCIES.map((f) => (
              <button key={f.id} type="button" role="radio" aria-checked={frequency === f.id} onClick={() => pickFrequency(f.id)} className={seg(frequency === f.id)}>{f.label}</button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="invest-duration" className="text-xs font-semibold text-ink">Duration ({freq.units})</label>
          <div className="mt-1.5 flex gap-2">
            <button type="button" aria-label={`Decrease duration by 1 ${freq.unit}`} onClick={() => step(-1)} disabled={d.ok && d.value <= freq.min}
              className="grid size-11 shrink-0 place-items-center rounded-control border border-line hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"><Minus className="size-4" aria-hidden /></button>
            <div className={cn("flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-control border bg-white px-3 focus-within:border-brand-600 focus-within:outline-2 focus-within:outline-brand-600", durationError ? "border-bad-fg" : "border-line")}>
              <input id="invest-duration" type="text" inputMode="numeric" pattern="[0-9]*" autoComplete="off" value={rawDuration} placeholder={`Minimum ${freq.min}`}
                onChange={(e) => { setRawDuration(e.target.value.replace(/[^\d]/g, "")); setDurationTouched(true); }}
                aria-invalid={durationError ? true : undefined} aria-describedby={durationError ? "invest-duration-err" : "invest-duration-hint"}
                className="tabular min-w-0 flex-1 bg-transparent text-base font-semibold text-ink outline-none" />
              <span className="shrink-0 text-sm text-muted">{freq.units}</span>
            </div>
            <button type="button" aria-label={`Increase duration by 1 ${freq.unit}`} onClick={() => step(1)}
              className="grid size-11 shrink-0 place-items-center rounded-control border border-line hover:bg-brand-50"><Plus className="size-4" aria-hidden /></button>
          </div>
          {durationError
            ? <p id="invest-duration-err" role="alert" className="mt-1.5 text-xs font-semibold text-bad-fg">{durationError}</p>
            : <p id="invest-duration-hint" className="mt-1.5 text-xs text-muted">Minimum {freq.min} {freq.units}. You can choose a longer duration.</p>}
        </div>

        <div className="rounded-control border border-brand-600 bg-brand-50 p-3" aria-live="polite">
          <p className="text-xs font-semibold text-muted">Your selection</p>
          <dl className="mt-2 space-y-1.5">
            {summary.map(([k, val]) => <div key={k} className="flex items-center justify-between gap-3 text-sm"><dt className="text-muted">{k}</dt><dd className="tabular font-bold text-ink">{val}</dd></div>)}
          </dl>
          {p.milestones.length > 0 && (
            <ol className="mt-3 space-y-1.5" aria-label="Project milestones">
              {p.milestones.map((m) => <li key={m.id} className="flex items-center justify-between gap-3 rounded-control border border-brand-600 bg-white px-3 py-2 text-sm"><span className="min-w-0 font-semibold text-brand-800">{m.title}</span><span className="tabular shrink-0 text-xs text-muted">{formatDate(m.plannedDate)}</span></li>)}
            </ol>
          )}
        </div>
        <p className="text-xs text-muted">{COPY.projectNotReturn}</p>

        <Button className="w-full" disabled={!ready} loading={busy} onClick={() => setReview(true)} aria-describedby={note ? "invest-note" : undefined}>Invest in This Project</Button>
        {note && <p id="invest-note" role="status" className="flex items-start gap-2 rounded-control border border-line bg-neutral-bg p-3 text-xs font-semibold text-ink"><Info className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />{investable || wrongRole ? note : `${note} You can still review your selection and send it as a contribution enquiry.`}</p>}
        {prog !== null && <p className="tabular text-xs text-muted">{prog}% of the sample target is already funded.</p>}

        <Button variant="secondary" className="w-full" aria-pressed={isSaved} onClick={onToggleSave}><Bookmark className={cn("size-4", isSaved && "fill-brand-600 text-brand-600")} aria-hidden /> {isSaved ? "Saved to wishlist" : "Add to wishlist"}</Button>
      </div>
      <div className="border-t border-line p-4">
        <Callout tone="neutral" title="Returns are not guaranteed">Demo only — no real payment is taken. {COPY.noGuarantee} <Link href="/risk-disclosure" className="font-semibold underline">Risk disclosure</Link></Callout>
      </div>

      <Modal open={review} onClose={() => setReview(false)} title="Review your investment (demo)">
        {v.ok && d.ok && (
          <div className="space-y-3 text-sm">
            <dl className="divide-y divide-line rounded-control border border-line">
              {([
                ["Project", p.title],
                ["Category", categoryLabel(p.category)],
                ["Location", p.location],
                ...summary,
                ["Project status", status],
              ] as [string, string][]).map(([k, val]) => (
                <div key={k} className="flex justify-between gap-3 px-3 py-2"><dt className="text-muted">{k}</dt><dd className="tabular text-right font-semibold">{val}</dd></div>
              ))}
            </dl>
            <p className="flex gap-2 rounded-control bg-info-bg p-3 text-xs text-info-fg">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                This is a demonstration review only. No payment is taken, no recurring schedule is set up and nothing is invested from this screen. No returns are calculated.
                {!investable && " This project currently accepts contribution enquiries only, so continuing opens the enquiry form with your selection."}
              </span>
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setReview(false)}>Back to edit</Button>
              <Button loading={busy} onClick={proceed}>{investable ? "Continue to demo investment" : "Continue to enquiry"}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
