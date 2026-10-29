"use client";

import { useMemo, useState } from "react";
import { Maximize2 } from "lucide-react";
import { Modal } from "@/components/common/feedback";
import { PriceChart } from "@/components/market/PriceChart";
import { ScenarioChart } from "@/components/projects/ScenarioChart";
import { RANGES, type RangeKey } from "@/data/market-products";
import { mockFor } from "@/data/project-dashboard-mock";
import { cn } from "@/lib/cn";
import { ILLUSTRATION_LABEL, ILLUSTRATIVE_SCENARIOS, illustrationRange, illustrativeSeries } from "@/lib/project-illustration";
import type { Project } from "@/types";

const chip = (on: boolean) => cn("inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-brand-600", on ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white text-ink hover:bg-brand-50");

/**
 * "Projected project economics". A project with a verified analysis uses the existing analysis-driven ScenarioChart.
 * Otherwise a clearly labelled illustrative index chart is shown (same controls: ranges, scenario, expand), or an
 * empty state when the project has no data at all. Mount with key={project.id}.
 */
export function ProjectEconomicsChart({ project: p }: { project: Project }) {
  const [range, setRange] = useState<RangeKey>("6M");
  const [scenarioId, setScenarioId] = useState<(typeof ILLUSTRATIVE_SCENARIOS)[number]["id"]>("base");
  const [expanded, setExpanded] = useState(false);
  const mock = mockFor(p.id);
  const il = useMemo(() => (mock ? illustrativeSeries(p.id, mock.trend) : null), [p.id, mock]);

  if (p.analysis) return <ScenarioChart project={p} />;
  if (!il) {
    return <p className="rounded-control bg-brand-50 p-6 text-center text-sm text-muted">No economics or performance data is available for this project, so no chart is shown. Nothing has been estimated.</p>;
  }
  const scenario = ILLUSTRATIVE_SCENARIOS.find((s) => s.id === scenarioId) ?? ILLUSTRATIVE_SCENARIOS[0];
  const points = illustrationRange(il, range);
  const fmt = (v: number) => `${v.toFixed(1)} pts`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label="Time range" className="flex flex-wrap gap-1.5">
          {RANGES.map((r) => <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)} className={chip(range === r)}>{r}</button>)}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={`scn-${p.id}`} className="sr-only">Scenario</label>
          <select id={`scn-${p.id}`} value={scenarioId} onChange={(e) => setScenarioId(e.target.value as typeof scenarioId)} className="min-h-10 rounded-control border border-line bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-brand-600">
            {ILLUSTRATIVE_SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button type="button" aria-label="Expand chart" onClick={() => setExpanded(true)} className="grid size-10 place-items-center rounded-control border border-line hover:bg-brand-50"><Maximize2 className="size-4" aria-hidden /></button>
        </div>
      </div>
      <div className="mt-3"><PriceChart points={points} range={range} factor={scenario.factor} unitShort="pts" valueFormat={fmt} label={`${p.title} illustrative economics chart`} /></div>
      <p className="mt-2 text-xs text-muted">{ILLUSTRATION_LABEL} Scenarios are demo multipliers, not predictions; the index can fall as well as rise.</p>

      <Modal open={expanded} onClose={() => setExpanded(false)} title={`${p.title}: projected project economics (illustrative)`} wide>
        <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Time range">{RANGES.map((r) => <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)} className={chip(range === r)}>{r}</button>)}</div>
        <PriceChart points={points} range={range} factor={scenario.factor} unitShort="pts" valueFormat={fmt} height={380} label={`${p.title} illustrative economics chart (expanded)`} />
        <p className="mt-2 text-xs text-muted">{ILLUSTRATION_LABEL}</p>
      </Modal>
    </div>
  );
}
