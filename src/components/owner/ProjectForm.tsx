"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button, Callout, Card, DefList, SelectField, TextAreaField, TextField } from "@/components/common/ui";
import { Stepper } from "@/components/common/Stepper";
import { useToast } from "@/components/common/feedback";
import { CATEGORIES, DURATION_OPTIONS, durationLabel, MAX_DURATION_MONTHS, TN_DISTRICTS } from "@/config/demo-config";
import { useDemo } from "@/context/DemoContext";
import { formatINR } from "@/lib/format";
import { projectCompleteness, saveProjectDraft, submitProject } from "@/lib/mock-service";
import type { CategoryId, Project, ProjectStage } from "@/types";

const STEPS = ["Basics", "Location & timing", "Production & costs", "Sales & pricing", "Risks, milestones & funding", "Review & submit"];

type Row = { id: string; a: string; b: string; c: string };
type F = {
  title: string; summary: string; objective: string; category: CategoryId; crop: string; method: string; certNote: string;
  location: string; region: string; district: string; stage: ProjectStage; months: string; season: string;
  qty: string; unit: string; loss: string; costs: Row[]; // a=label b=amount c=kind
  price: string; deduct: string; priceSource: string;
  risks: Row[]; // a=title b=severity c=mitigation
  milestones: Row[]; // a=title b=date
  funding: string; uses: Row[]; // a=label b=amount
};

const uid = () => Math.random().toString(36).slice(2, 8);
const num = (s: string) => (s.trim() === "" ? NaN : Number(s.replace(/,/g, "")));

function fromProject(p: Project | undefined): F {
  const a = p?.analysis;
  return {
    title: p?.title ?? "", summary: p?.summary ?? "", objective: p?.objective ?? "", category: p?.category ?? "crop_cultivation", crop: p?.crop ?? "",
    method: p?.productionMethod ?? "Organic practices (not certified)", certNote: p?.certification.status === "claimed" ? p.certification.note : "",
    location: p?.location ?? "", region: p?.region ?? "", district: p?.district ?? "", stage: p?.stage ?? "preparation", months: String(p?.durationMonths ?? 1), season: p?.season ?? "",
    qty: a ? String(a.plannedQty) : "", unit: a?.qtyUnit ?? "kg", loss: a ? String(a.lossRatePct) : "10",
    costs: a?.costs.map((c) => ({ id: c.id, a: c.label, b: String(c.amount), c: c.kind })) ?? [{ id: uid(), a: "", b: "", c: "opex" }],
    price: a?.pricePerUnit != null ? String(a.pricePerUnit) : "", deduct: a?.salesDeductionPct != null ? String(a.salesDeductionPct) : "5", priceSource: a?.assumptions.find((x) => x.label.includes("price") || x.label === "Price")?.source ?? "",
    risks: p?.risks.map((r) => ({ id: r.id, a: r.title, b: r.severity, c: r.mitigation })) ?? [{ id: uid(), a: "", b: "medium", c: "" }],
    milestones: p?.milestones.map((m) => ({ id: m.id, a: m.title, b: m.plannedDate, c: "" })) ?? [{ id: uid(), a: "", b: "", c: "" }],
    funding: p?.funding ? String(p.funding.target) : "", uses: p?.useOfFunds.map((u) => ({ id: uid(), a: u.label, b: String(u.amount), c: "" })) ?? [{ id: uid(), a: "", b: "", c: "" }],
  };
}

function toProject(f: F, base: Project | undefined, ownerId: string): Project {
  const costs = f.costs.filter((c) => c.a.trim() && num(c.b) > 0).map((c, i) => ({ id: `c${i + 1}`, label: c.a.trim(), amount: num(c.b), kind: (c.c === "capex" ? "capex" : "opex") as "opex" | "capex", basis: "estimate" as const }));
  const price = num(f.price);
  const now = new Date().toISOString();
  return {
    id: base?.id ?? "new", ownerId, title: f.title.trim(), category: f.category, crop: f.crop.trim(), location: f.location.trim(), region: f.region.trim() || "—", district: f.district,
    summary: f.summary.trim(), objective: f.objective.trim(), productionMethod: f.method,
    certification: f.certNote.trim() ? { status: "claimed", note: `${f.certNote.trim()} (owner statement, not verified)` } : { status: "none", note: "No certification claimed." },
    stage: f.stage, status: base?.status ?? "draft", durationMonths: num(f.months) || 1, season: f.season.trim() || "—", featured: false,
    createdAt: base?.createdAt ?? now, updatedAt: now,
    funding: num(f.funding) > 0 ? { target: num(f.funding), raised: base?.funding?.raised ?? 0 } : null,
    demoConfig: base?.demoConfig ?? { investable: false, notInvestableReason: "Not published.", minAmount: 100, maxAmount: 25000 },
    analysis: num(f.qty) > 0 ? {
      asOf: now.slice(0, 10), reviewedBy: null, plannedQty: num(f.qty), qtyUnit: f.unit.trim() || "units", lossRatePct: Math.min(100, Math.max(0, num(f.loss) || 0)),
      pricePerUnit: price > 0 ? price : null, salesDeductionPct: price > 0 ? Math.min(100, Math.max(0, num(f.deduct) || 0)) : null, costs,
      assumptions: [
        { label: "Planned output", value: f.qty, unit: f.unit, period: "per cycle", source: "Owner estimate", evidence: "operator_provided", reviewedAt: null },
        ...(price > 0 ? [{ label: "Selling price", value: f.price, unit: `INR per ${f.unit}`, period: "sale window", source: f.priceSource.trim() || "Owner estimate", evidence: "operator_provided" as const, reviewedAt: null }] : []),
      ],
    } : null,
    risks: f.risks.filter((r) => r.a.trim()).map((r, i) => ({ id: `r${i + 1}`, title: r.a.trim(), severity: (["low", "medium", "high"].includes(r.b) ? r.b : "medium") as "low" | "medium" | "high", mitigation: r.c.trim() || "Not provided" })),
    useOfFunds: f.uses.filter((u) => u.a.trim() && num(u.b) > 0).map((u) => ({ label: u.a.trim(), amount: num(u.b) })),
    milestones: f.milestones.filter((m) => m.a.trim() && m.b).map((m, i) => ({ id: `m${i + 1}`, title: m.a.trim(), plannedDate: m.b, actualDate: null, status: "planned" as const })),
    updates: base?.updates ?? [], documentTitles: base?.documentTitles ?? [], reviewComments: base?.reviewComments ?? [],
  };
}

function Rows({ rows, onChange, labels, kinds, empty }: { rows: Row[]; onChange: (r: Row[]) => void; labels: [string, string, string?]; kinds?: { value: string; label: string }[]; empty: Row }) {
  const upd = (id: string, k: "a" | "b" | "c", v: string) => onChange(rows.map((r) => (r.id === id ? { ...r, [k]: v } : r)));
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={r.id} className="grid gap-3 rounded-control border border-line bg-earth-50 p-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
          <TextField label={`${labels[0]} ${i + 1}`} value={r.a} onChange={(e) => upd(r.id, "a", e.target.value)} />
          {labels[1] === "Severity" ? (
            <SelectField label="Severity" value={r.b} onChange={(e) => upd(r.id, "b", e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></SelectField>
          ) : (
            <TextField label={labels[1]} value={r.b} onChange={(e) => upd(r.id, "b", e.target.value)} type={labels[1].toLowerCase().includes("date") ? "date" : "text"} inputMode={labels[1].toLowerCase().includes("amount") ? "decimal" : undefined} />
          )}
          {kinds ? (
            <SelectField label={labels[2] ?? "Type"} value={r.c} onChange={(e) => upd(r.id, "c", e.target.value)}>{kinds.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}</SelectField>
          ) : labels[2] ? <TextField label={labels[2]} value={r.c} onChange={(e) => upd(r.id, "c", e.target.value)} /> : <span />}
          <Button variant="ghost" aria-label={`Remove row ${i + 1}`} className="self-end text-bad-fg" onClick={() => onChange(rows.length > 1 ? rows.filter((x) => x.id !== r.id) : [{ ...empty, id: uid() }])}><Trash2 className="size-4" aria-hidden /></Button>
        </div>
      ))}
      <Button variant="secondary" onClick={() => onChange([...rows, { ...empty, id: uid() }])}><Plus className="size-4" aria-hidden /> Add row</Button>
    </div>
  );
}

export function ProjectForm({ existing }: { existing?: Project }) {
  const { user, actor, run } = useDemo();
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<F>(() => fromProject(existing));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof F>(k: K, v: F[K]) => setF((x) => ({ ...x, [k]: v }));
  const draft = useMemo(() => toProject(f, existing, user?.id ?? ""), [f, existing, user]);
  const issues = useMemo(() => projectCompleteness(draft), [draft]);

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (f.title.trim().length < 5) e.title = "Enter a title (5+ characters).";
      if (f.summary.trim().length < 20) e.summary = "Write a summary (20+ characters).";
    }
    if (s === 1) {
      if (!f.location.trim()) e.location = "Enter the farm location.";
      if (!(TN_DISTRICTS as readonly string[]).includes(f.district)) e.district = "Select a district.";
      const m = num(f.months);
      if (!(Number.isInteger(m) && m >= 1 && m <= MAX_DURATION_MONTHS)) e.months = "Select a duration of 1 to 3 months.";
    }
    if (s === 2) {
      if (!(num(f.qty) > 0)) e.qty = "Enter a planned quantity above zero.";
      const l = num(f.loss);
      if (!(l >= 0 && l <= 100)) e.loss = "Loss rate must be between 0 and 100.";
      if (!f.costs.some((c) => c.a.trim() && num(c.b) > 0)) e.costs = "Add at least one cost line with an amount above zero.";
    }
    if (s === 3 && f.price.trim() !== "") {
      if (!(num(f.price) > 0)) e.price = "Price must be above zero, or leave blank if you have no price evidence.";
      const d = num(f.deduct);
      if (!(d >= 0 && d <= 100)) e.deduct = "Deductions must be between 0 and 100.";
    }
    if (s === 4) {
      if (!(num(f.funding) > 0)) e.funding = "Enter a funding target above zero.";
      if (!f.risks.some((r) => r.a.trim())) e.risks = "Describe at least one risk.";
      if (!f.milestones.some((m) => m.a.trim() && m.b)) e.milestones = "Add at least one milestone with a date.";
    }
    return e;
  };

  const next = () => { const e = validate(step); setErrors(e); if (!Object.keys(e).length) setStep(step + 1); };

  const save = (andSubmit: boolean) => {
    if (busy) return;
    setBusy(true);
    const r = run((s) => saveProjectDraft(s, draft, actor));
    if (!r.ok) { setBusy(false); return toast(r.error, "bad"); }
    if (!andSubmit) { toast("Draft saved locally.", "ok"); setBusy(false); return router.push("/owner/projects"); }
    const sub = run((s) => submitProject(s, r.data, actor));
    setBusy(false);
    if (!sub.ok) return toast(sub.error, "bad");
    toast("Submitted for demo review. It will appear in the admin queue.", "ok");
    router.push(`/owner/projects/${r.data}`);
  };

  return (
    <div className="max-w-3xl">
      <Stepper steps={STEPS} current={step} />
      <Card className="space-y-4">
        {step === 0 && (<>
          <TextField label="Project title" required value={f.title} onChange={(e) => set("title", e.target.value)} error={errors.title} />
          <TextAreaField label="Summary" required value={f.summary} onChange={(e) => set("summary", e.target.value)} error={errors.summary} />
          <TextField label="Objective" value={f.objective} onChange={(e) => set("objective", e.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2"><SelectField label="Category" value={f.category} onChange={(e) => set("category", e.target.value as CategoryId)}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</SelectField><TextField label="Crop / product" value={f.crop} onChange={(e) => set("crop", e.target.value)} /></div>
          <SelectField label="Production method" value={f.method} onChange={(e) => set("method", e.target.value)}><option>Organic practices (not certified)</option><option>Conventional</option><option>Hydroponic</option><option>Certified organic (certificate required)</option></SelectField>
          <TextField label="Certification details (optional)" value={f.certNote} onChange={(e) => set("certNote", e.target.value)} hint="Anything entered is shown as an unverified owner statement until reviewed." />
        </>)}
        {step === 1 && (<>
          <div className="grid gap-4 sm:grid-cols-2"><TextField label="Farm location" required value={f.location} onChange={(e) => set("location", e.target.value)} error={errors.location} /><TextField label="Region" value={f.region} onChange={(e) => set("region", e.target.value)} /></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><SelectField label="District" required value={f.district} onChange={(e) => set("district", e.target.value)} error={errors.district}><option value="">Select district</option>{TN_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}</SelectField><SelectField label="Duration" required value={f.months} onChange={(e) => set("months", e.target.value)} error={errors.months}>{DURATION_OPTIONS.map((m) => <option key={m} value={m}>{durationLabel(m)}</option>)}</SelectField><TextField label="Season" value={f.season} onChange={(e) => set("season", e.target.value)} /><SelectField label="Current stage" value={f.stage} onChange={(e) => set("stage", e.target.value as ProjectStage)}><option value="preparation">Preparation</option><option value="growing">Growing / production</option><option value="harvest">Harvest</option><option value="sales">Sales & delivery</option></SelectField></div>
        </>)}
        {step === 2 && (<>
          <div className="grid gap-4 sm:grid-cols-3"><TextField label="Planned output" required inputMode="decimal" value={f.qty} onChange={(e) => set("qty", e.target.value)} error={errors.qty} /><TextField label="Unit" value={f.unit} onChange={(e) => set("unit", e.target.value)} hint="kg, litres, eggs…" /><TextField label="Expected loss (%)" inputMode="decimal" value={f.loss} onChange={(e) => set("loss", e.target.value)} error={errors.loss} /></div>
          <h3 className="pt-2 text-sm font-semibold">Cost lines (INR)</h3>
          <Rows rows={f.costs} onChange={(r) => set("costs", r)} labels={["Cost line", "Amount", "Type"]} kinds={[{ value: "opex", label: "Operating" }, { value: "capex", label: "Capital" }]} empty={{ id: "", a: "", b: "", c: "opex" }} />
          {errors.costs && <p role="alert" className="text-xs font-medium text-bad-fg">{errors.costs}</p>}
        </>)}
        {step === 3 && (<>
          <Callout tone="info">If you have no price evidence, leave the price blank. Reviewers will see “not available” rather than an invented figure.</Callout>
          <div className="grid gap-4 sm:grid-cols-2"><TextField label="Expected price per unit (INR)" inputMode="decimal" value={f.price} onChange={(e) => set("price", e.target.value)} error={errors.price} /><TextField label="Sales deductions (%)" inputMode="decimal" value={f.deduct} onChange={(e) => set("deduct", e.target.value)} error={errors.deduct} hint="Commission, rejection, discounts" /></div>
          <TextField label="Price source / buyer evidence" value={f.priceSource} onChange={(e) => set("priceSource", e.target.value)} hint="Labelled “operator-provided” until a reviewer checks it." />
        </>)}
        {step === 4 && (<>
          <TextField label="Funding target (INR)" required inputMode="decimal" value={f.funding} onChange={(e) => set("funding", e.target.value)} error={errors.funding} />
          <h3 className="text-sm font-semibold">Use of funds</h3>
          <Rows rows={f.uses} onChange={(r) => set("uses", r)} labels={["Item", "Amount"]} empty={{ id: "", a: "", b: "", c: "" }} />
          <h3 className="pt-2 text-sm font-semibold">Risks & mitigations</h3>
          <Rows rows={f.risks} onChange={(r) => set("risks", r)} labels={["Risk", "Severity", "Mitigation"]} kinds={undefined} empty={{ id: "", a: "", b: "medium", c: "" }} />
          {errors.risks && <p role="alert" className="text-xs font-medium text-bad-fg">{errors.risks}</p>}
          <h3 className="pt-2 text-sm font-semibold">Milestones</h3>
          <Rows rows={f.milestones} onChange={(r) => set("milestones", r)} labels={["Milestone", "Planned date"]} empty={{ id: "", a: "", b: "", c: "" }} />
          {errors.milestones && <p role="alert" className="text-xs font-medium text-bad-fg">{errors.milestones}</p>}
        </>)}
        {step === 5 && (<>
          <DefList rows={[["Title", draft.title || "—"], ["Location", draft.location || "—"], ["Planned output", draft.analysis ? `${draft.analysis.plannedQty} ${draft.analysis.qtyUnit}` : "—"], ["Cost lines", draft.analysis ? `${draft.analysis.costs.length} (${formatINR(draft.analysis.costs.reduce((s, c) => s + c.amount, 0))})` : "—"], ["Funding target", draft.funding ? formatINR(draft.funding.target) : "—"], ["Risks / milestones", `${draft.risks.length} / ${draft.milestones.length}`]]} />
          {issues.length > 0 ? <Callout tone="warn" title="Not ready to submit"><ul className="list-disc pl-5">{issues.map((i) => <li key={i}>{i}</li>)}</ul></Callout> : <Callout tone="ok">Everything required for a demo submission is filled in. Submitting does not publish the project; an admin must review it.</Callout>}
        </>)}
        <div className="flex flex-wrap justify-between gap-2 pt-2">
          <Button variant="secondary" disabled={step === 0} onClick={() => { setErrors({}); setStep(step - 1); }}>Back</Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" loading={busy} disabled={f.title.trim().length < 5} title={f.title.trim().length < 5 ? "Add a title first" : undefined} onClick={() => save(false)}>Save draft</Button>
            {step < 5 ? <Button onClick={next}>Continue</Button> : <Button loading={busy} disabled={issues.length > 0} title={issues.length ? "Complete the items above first" : undefined} onClick={() => save(true)}>Submit for review (demo)</Button>}
          </div>
        </div>
      </Card>
    </div>
  );
}
