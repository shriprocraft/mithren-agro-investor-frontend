"use client";

import { useMemo, useState } from "react";
import { Button, Callout, EmptyState, Section } from "@/components/common/ui";
import { EvidenceBadge, ForecastTag } from "@/components/common/badges";
import { COPY, SCENARIOS, type ScenarioKey } from "@/config/demo-config";
import { computeAllScenarios, computeScenario, computeSensitivity, costBreakdown, ZERO_ADJ, type Adjustments, type ScenarioResult } from "@/lib/analysis-calculations";
import { formatDate, formatINR, formatNumber, formatPercent, formatSignedINR, MISSING } from "@/lib/format";
import { analysisCompleteness } from "@/lib/project-helpers";
import type { Project } from "@/types";

const NA = "Not available in demo data";

function Slider({ label, value, min, max, step = 1, unit, onChange }: { label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void }) {
  const id = `sl-${label.replace(/\W/g, "")}`;
  return (
    <div>
      <label htmlFor={id} className="flex justify-between text-sm font-semibold"><span>{label}</span><span className="tabular text-muted">{value > 0 ? "+" : value < 0 ? "−" : ""}{Math.abs(value)}{unit} <span className="font-normal">(baseline 0)</span></span></label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 h-2 w-full accent-brand-600" />
    </div>
  );
}

const money = (v: number | null) => (v === null ? NA : formatINR(v));

function ResultRows({ r, unit }: { r: ScenarioResult; unit: string }) {
  const rows: [string, string][] = [
    ["Planned output", formatNumber(r.plannedQty, unit)],
    ["Loss / rejection rate", formatPercent(r.lossRatePct)],
    ["Saleable quantity", formatNumber(r.saleableQty, unit)],
    ["Assumed price", r.price === null ? NA : `${formatINR(r.price)} per ${unit}`],
    ["Gross sales", money(r.grossSales)],
    ["Sales deductions", money(r.deductions)],
    ["Net sales", money(r.netSales)],
    ["Total project cost", formatINR(r.totalCost)],
    ["Project surplus / (deficit)", r.surplus === null ? NA : formatSignedINR(r.surplus)],
    ["Project margin on net sales", r.marginPct === null ? NA : formatPercent(r.marginPct)],
    ["Break-even price", r.breakEvenPrice === null ? NA : `${formatINR(r.breakEvenPrice)} per ${unit}`],
  ];
  return (
    <div className="overflow-x-auto"><table className="w-full text-sm">
      <caption className="sr-only">Scenario outputs (illustrative sample data)</caption>
      <tbody>{rows.map(([k, v]) => (<tr key={k} className="border-t border-line first:border-0"><th scope="row" className="py-2 pr-3 text-left font-medium text-muted">{k}</th><td className="tabular py-2 text-right font-semibold">{v}</td></tr>))}</tbody>
    </table></div>
  );
}

export function ProjectAnalysisView({ project: p }: { project: Project }) {
  const a = p.analysis;
  const [scenario, setScenario] = useState<ScenarioKey | "custom">("base");
  const [adj, setAdj] = useState<Adjustments>(ZERO_ADJ);

  const all = useMemo(() => (a ? computeAllScenarios(a) : null), [a]);
  const sens = useMemo(() => (a ? computeSensitivity(a) : []), [a]);
  const current = useMemo(() => (a ? computeScenario(a, adj) : null), [a, adj]);

  if (!a || !all || !current) {
    return <EmptyState title="Analysis not available yet" body="The project owner has not submitted production and cost assumptions, so no economics are shown. Nothing has been estimated on their behalf." />;
  }

  const comp = analysisCompleteness(p);
  const cb = costBreakdown(a);
  const pick = (k: ScenarioKey) => { const { yieldPct, pricePct, costPct, extraLossPts } = SCENARIOS[k]; setAdj({ yieldPct, pricePct, costPct, extraLossPts }); setScenario(k); };
  const set = (patch: Partial<Adjustments>) => { setAdj({ ...adj, ...patch }); setScenario("custom"); };
  const isBaseline = adj.yieldPct === 0 && adj.pricePct === 0 && adj.costPct === 0 && adj.extraLossPts === 0;

  return (
    <div className="space-y-4">
      <Callout tone="neutral" title="Illustrative sample data">
        All figures are fictional demo inputs. Analysis as of {formatDate(a.asOf)}{a.reviewedBy ? ` · reviewed by ${a.reviewedBy} (demo)` : " · not yet reviewed"}. {COPY.projectNotReturn}
      </Callout>
      {comp === "limited" && <Callout tone="info" title="Limited analysis">Sales price evidence has not been provided, so revenue, surplus and margin are shown as “{NA}”. They have not been estimated.</Callout>}

      <Section title="Production & market assumptions" badge={<ForecastTag kind="forecast" />}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <caption className="sr-only">Assumptions with units, period, source and evidence label</caption>
            <thead className="text-left text-xs uppercase text-muted"><tr><th className="py-2 pr-3">Assumption</th><th className="py-2 pr-3">Value</th><th className="py-2 pr-3">Period</th><th className="py-2 pr-3">Source</th><th className="py-2">Evidence</th></tr></thead>
            <tbody>
              {a.assumptions.map((x) => (
                <tr key={x.label} className="border-t border-line align-top">
                  <th scope="row" className="py-2 pr-3 text-left font-medium">{x.label}</th>
                  <td className="tabular py-2 pr-3">{x.value} {x.unit !== "—" ? x.unit : ""}</td>
                  <td className="py-2 pr-3 text-muted">{x.period}</td>
                  <td className="py-2 pr-3 text-muted">{x.source}{x.reviewedAt ? ` · reviewed ${formatDate(x.reviewedAt)}` : ""}</td>
                  <td className="py-2"><EvidenceBadge evidence={x.evidence} /></td>
                </tr>
              ))}
              <tr className="border-t border-line"><th scope="row" className="py-2 pr-3 text-left font-medium">Planned output</th><td className="tabular py-2 pr-3">{formatNumber(a.plannedQty, a.qtyUnit)}</td><td className="py-2 pr-3 text-muted">per cycle</td><td className="py-2 pr-3 text-muted">Owner plan</td><td className="py-2"><EvidenceBadge evidence="operator_provided" /></td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">“Document-supported” means a document was submitted, not that the figure is verified.</p>
      </Section>

      <Section title="Cost breakdown" badge={<ForecastTag kind="forecast" />}>
        <div className="overflow-x-auto"><table className="w-full min-w-[22rem] text-sm">
          <caption className="sr-only">Project cost lines</caption>
          <thead className="text-left text-xs uppercase text-muted"><tr><th className="py-2">Line</th><th className="py-2">Type</th><th className="py-2">Basis</th><th className="py-2 text-right">Amount</th></tr></thead>
          <tbody>
            {a.costs.map((c) => (<tr key={c.id} className="border-t border-line"><th scope="row" className="py-2 text-left font-medium">{c.label}</th><td className="py-2 text-muted">{c.kind === "capex" ? "Capital" : "Operating"}</td><td className="py-2 capitalize text-muted">{c.basis}</td><td className="tabular py-2 text-right">{formatINR(c.amount)}</td></tr>))}
            <tr className="border-t-2 border-line font-semibold"><td className="py-2" colSpan={3}>Total (operating {formatINR(cb.opex)} + capital {formatINR(cb.capex)})</td><td className="tabular py-2 text-right">{formatINR(cb.total)}</td></tr>
          </tbody>
        </table></div>
      </Section>

      <Section title="Scenario analysis" badge={<ForecastTag kind="forecast" />}>
        <p className="mb-3 text-sm text-muted">Scenario names do not imply probability. Adjust the controls to test your own assumptions; adjusted figures are simulations, not forecasts or promises.</p>
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Scenario presets">
          {(Object.keys(SCENARIOS) as ScenarioKey[]).map((k) => (
            <Button key={k} variant={scenario === k ? "primary" : "secondary"} aria-pressed={scenario === k} onClick={() => pick(k)}>{SCENARIOS[k].label}</Button>
          ))}
          {scenario === "custom" && <span className="inline-flex items-center rounded-full bg-info-bg px-3 text-xs font-semibold text-info-fg">Custom simulation</span>}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-control border border-line bg-earth-50 p-4">
            <Slider label="Yield / output" value={adj.yieldPct} min={-40} max={30} unit="%" onChange={(v) => set({ yieldPct: v })} />
            <Slider label="Selling price" value={adj.pricePct} min={-40} max={30} unit="%" onChange={(v) => set({ pricePct: v })} />
            <Slider label="Input costs" value={adj.costPct} min={-20} max={40} unit="%" onChange={(v) => set({ costPct: v })} />
            <Slider label="Extra production loss" value={adj.extraLossPts} min={-5} max={20} unit=" pts" onChange={(v) => set({ extraLossPts: v })} />
            <Button variant="secondary" disabled={isBaseline} title={isBaseline ? "Already at baseline" : undefined} onClick={() => pick("base")}>Reset to baseline</Button>
          </div>
          <div aria-live="polite"><ResultRows r={current} unit={a.qtyUnit} /></div>
        </div>
        <h3 className="mb-2 mt-6 text-sm font-semibold">Side-by-side (preset scenarios)</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <caption className="sr-only">Downside, base and upside scenario comparison</caption>
            <thead className="text-left text-xs uppercase text-muted"><tr><th className="py-2">Metric</th>{(Object.keys(SCENARIOS) as ScenarioKey[]).map((k) => <th key={k} className="py-2 text-right">{SCENARIOS[k].label}</th>)}</tr></thead>
            <tbody>
              {([
                ["Saleable quantity", (r: ScenarioResult) => formatNumber(r.saleableQty, a.qtyUnit)],
                ["Net sales", (r: ScenarioResult) => money(r.netSales)],
                ["Total cost", (r: ScenarioResult) => formatINR(r.totalCost)],
                ["Project surplus / (deficit)", (r: ScenarioResult) => (r.surplus === null ? NA : formatSignedINR(r.surplus))],
              ] as [string, (r: ScenarioResult) => string][]).map(([label, f]) => (
                <tr key={label} className="border-t border-line"><th scope="row" className="py-2 text-left font-medium">{label}</th>{(Object.keys(SCENARIOS) as ScenarioKey[]).map((k) => <td key={k} className="tabular py-2 text-right">{f(all[k])}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Sensitivity analysis" defaultOpen={false} badge={<ForecastTag kind="forecast" />}>
        <p className="mb-3 text-sm text-muted">Project surplus / (deficit) when one input moves. Ranges are illustrative test ranges, not universal agricultural assumptions.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <caption className="sr-only">One-variable sensitivity of project surplus</caption>
            <thead className="text-left text-xs uppercase text-muted"><tr><th className="py-2">Input</th><th className="py-2 text-right">Adverse</th><th className="py-2 text-right">Base</th><th className="py-2 text-right">Favourable</th></tr></thead>
            <tbody>{sens.map((s) => (<tr key={s.label} className="border-t border-line"><th scope="row" className="py-2 text-left font-medium">{s.label}</th><td className="tabular py-2 text-right">{s.low.surplus === null ? MISSING : formatSignedINR(s.low.surplus)}</td><td className="tabular py-2 text-right">{s.base.surplus === null ? MISSING : formatSignedINR(s.base.surplus)}</td><td className="tabular py-2 text-right">{s.high.surplus === null ? MISSING : formatSignedINR(s.high.surplus)}</td></tr>))}</tbody>
          </table>
        </div>
      </Section>

      {a.actuals && (
        <Section title="Planned vs actual" badge={<ForecastTag kind="actual" />}>
          <div className="overflow-x-auto"><table className="w-full min-w-[22rem] text-sm">
            <caption className="sr-only">Planned versus self-reported actual results</caption>
            <thead className="text-left text-xs uppercase text-muted"><tr><th className="py-2">Measure</th><th className="py-2 text-right">Forecast</th><th className="py-2 text-right">Actual (self-reported)</th></tr></thead>
            <tbody>
              <tr className="border-t border-line"><th scope="row" className="py-2 text-left font-medium">Saleable output</th><td className="tabular py-2 text-right">{formatNumber(all.base.saleableQty, a.qtyUnit)}</td><td className="tabular py-2 text-right">{formatNumber(a.actuals.qty, a.qtyUnit)}</td></tr>
              <tr className="border-t border-line"><th scope="row" className="py-2 text-left font-medium">Average price</th><td className="tabular py-2 text-right">{formatINR(a.pricePerUnit)}</td><td className="tabular py-2 text-right">{formatINR(a.actuals.avgPrice)}</td></tr>
              <tr className="border-t border-line"><th scope="row" className="py-2 text-left font-medium">Total cost</th><td className="tabular py-2 text-right">{formatINR(all.base.totalCost)}</td><td className="tabular py-2 text-right">{formatINR(a.actuals.totalCost)}</td></tr>
            </tbody>
          </table></div>
          <p className="mt-2 text-xs text-muted">{a.actuals.label} Forecast and actual values are kept in separate columns on purpose.</p>
        </Section>
      )}
    </div>
  );
}
