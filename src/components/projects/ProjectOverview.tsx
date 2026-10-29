"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { DemoDocumentPreview } from "@/components/common/feedback";
import { Badge, DefList, Section } from "@/components/common/ui";
import { MilestoneTimeline } from "@/components/common/visuals";
import { ProjectAnalysisView } from "@/components/analysis/ProjectAnalysisView";
import { ProjectEconomicsChart } from "@/components/projects/ProjectEconomicsChart";
import { categoryLabel, COPY, durationLabel, STAGE_LABEL } from "@/config/demo-config";
import { activitiesFor, MOCK_LABEL, mockFor } from "@/data/project-dashboard-mock";
import { fundingProgress } from "@/lib/analysis-calculations";
import { formatDate, formatINR } from "@/lib/format";
import { riskLabel, RISK_METHOD } from "@/lib/project-helpers";
import { regionLabel, regionOf, stateOf } from "@/lib/regions";
import type { Project } from "@/types";

const Empty = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-muted">{children}</p>;

/**
 * Centre column of Browse Projects, in reference order: header → projected project economics → funding progress →
 * five funding cards → four collapsible sections. Every value comes from the selected project; where data is
 * missing an empty state is shown instead of an invented number. Mount with key={project.id} so nothing carries over.
 */
export function ProjectOverview({ project: p }: { project: Project }) {
  const [doc, setDoc] = useState<string | null>(null);
  const prog = fundingProgress(p.funding);
  const remaining = p.funding ? Math.max(0, p.funding.target - p.funding.raised) : null;
  const state = stateOf(p);
  const region = regionOf(p);
  const location = [p.district, p.location].filter(Boolean).join(", ") || "Location not provided";
  const mock = mockFor(p.id);
  const history = [...activitiesFor(p.id)].sort((a, b) => b.date.localeCompare(a.date));
  const risky = p.risks.length > 0;

  return (
    <section className="min-w-0 space-y-5" aria-label="Project details">
      <nav aria-label="Breadcrumb" className="min-w-0 truncate text-xs text-[#667085]">
        Explore <span aria-hidden>›</span> Browse Projects <span aria-hidden>›</span> {categoryLabel(p.category)} <span aria-hidden>›</span> <span className="font-semibold text-[#1F2D21]">{p.title}</span>
      </nav>

      {/* A. Project header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1F2D21] sm:text-3xl">{p.title}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#667085]">
          <span>{location}{state ? `, ${state}` : ""}{region ? ` · ${regionLabel(region)}` : ""}</span>
          <span aria-hidden className="text-[#E8F1EA]">|</span><span>{categoryLabel(p.category)}</span>
          <span aria-hidden className="text-[#E8F1EA]">|</span><span>{p.crop}</span>
          <span aria-hidden className="text-[#E8F1EA]">|</span><span>{STAGE_LABEL[p.stage]}</span>
        </p>
        <p className="mt-3 max-w-3xl text-sm text-[#1F2D21]">{p.fullDescription ?? p.summary}</p>
      </div>

      {/* B. Projected project economics */}
      <div className="rounded-xl border border-[#E8F1EA] bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold text-[#1F2D21]">Projected project economics</h2>
          <span className="text-xs text-[#667085]">{p.analysis ? "Illustrative scenarios · not historical performance" : "Illustrative demo data · not historical performance"}</span>
        </div>
        <div className="mt-3"><ProjectEconomicsChart key={p.id} project={p} /></div>
      </div>

      {/* C. Funding progress */}
      <div className="rounded-xl border border-[#E8F1EA] bg-white p-5">
        <div className="flex items-baseline justify-between"><h2 className="text-sm font-bold text-[#1F2D21]">Funding progress</h2><span className="tabular text-sm font-bold text-[#1F2D21]">{prog === null ? "—" : `${prog}%`}</span></div>
        <div role="progressbar" aria-label={`Funding progress for ${p.title}`} aria-valuenow={prog ?? 0} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#E8F1EA]"><div className="h-full rounded-full bg-[#2E7D32]" style={{ width: `${prog ?? 0}%` }} /></div>
        {prog === null && <p className="mt-2 text-xs text-[#667085]">No funding target has been set for this project.</p>}
      </div>

      {/* D. Five funding cards */}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          ["Funding target", p.funding ? formatINR(p.funding.target) : "—"],
          ["Amount funded", p.funding ? formatINR(p.funding.raised) : "—"],
          ["Funding progress", prog === null ? "—" : `${prog}%`],
          ["Remaining", remaining === null ? "—" : formatINR(remaining)],
          ["Duration", durationLabel(p.durationMonths)],
        ].map(([k, v]) => (
          <div key={k} className="min-w-0 rounded-xl border border-[#E8F1EA] bg-white px-4 py-3"><dt className="truncate text-xs text-[#667085]">{k}</dt><dd className="tabular mt-1 truncate text-base font-bold text-[#1F2D21]">{v}</dd></div>
        ))}
      </dl>
      <p className="-mt-2 text-xs text-[#667085]">{p.funding ? "Funding figures are sample demo data. " : "No funding figures have been supplied for this project. "}Minimum investment: {formatINR(p.demoConfig.minAmount)}.</p>

      {/* E. Four collapsible sections */}
      <div className="space-y-3">
        <Section title="Project financials" defaultOpen={false}>
          {p.useOfFunds.length === 0 ? <Empty>Use of funds has not been provided.</Empty> : (
            <table className="mb-4 w-full text-sm"><caption className="sr-only">Planned use of funds</caption><tbody>{p.useOfFunds.map((u) => (<tr key={u.label} className="border-t border-line first:border-0"><th scope="row" className="py-2 text-left font-medium">{u.label}</th><td className="tabular py-2 text-right">{formatINR(u.amount)}</td></tr>))}</tbody></table>
          )}
          {p.analysis ? <ProjectAnalysisView project={p} /> : <Empty>No financial analysis has been submitted for this project, so no costs, prices or margins are shown.</Empty>}
          {mock && (
            <div className="mt-4 border-t border-line pt-4">
              <h3 className="mb-2 text-sm font-semibold">Illustrative metrics</h3>
              <DefList rows={[["Start date", formatDate(mock.startDate)], ["Estimated completion", formatDate(mock.estimatedCompletionDate)], ["Illustrative budget", formatINR(mock.budget)], ["Illustrative contributions", formatINR(mock.contributions)], ["Illustrative progress", `${mock.progress}%`]]} />
              <p className="mt-2 text-xs text-muted">{MOCK_LABEL}</p>
            </div>
          )}
        </Section>

        <Section title="Production & market assumptions" defaultOpen={false}>
          <p className="text-sm"><strong>Objective:</strong> {p.objective}</p>
          {p.objectives && p.objectives.length > 1 && <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{p.objectives.map((o) => <li key={o}>{o}</li>)}</ul>}
          {p.activities && p.activities.length > 0 && <><h3 className="mt-4 text-sm font-semibold">Key activities</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{p.activities.map((o) => <li key={o}>{o}</li>)}</ul></>}
          <div className="mt-4"><DefList rows={[["Production method", p.productionMethod], ["Season", p.season], ["Region", p.region], ["District", p.district || "—"]]} /></div>
          <div className="mt-4"><MilestoneTimeline items={p.milestones} /></div>
        </Section>

        <Section title="Risks & disclosures" defaultOpen={false} badge={<Badge tone={risky && riskLabel(p) === "Higher" ? "warn" : "neutral"}>Risk label (demo): {risky ? riskLabel(p) : "Not rated"}</Badge>}>
          {!risky ? <Empty>No risks have been listed yet, so no risk label can be given.</Empty> : (
            <ul className="space-y-3">{p.risks.map((r) => (<li key={r.id} className="rounded-control border border-line p-3 text-sm"><p className="font-semibold">{r.title} <Badge tone={r.severity === "high" ? "bad" : r.severity === "medium" ? "warn" : "neutral"} className="ml-1">{r.severity} severity</Badge></p><p className="mt-1 text-muted"><strong>Mitigation:</strong> {r.mitigation}</p></li>))}</ul>
          )}
          <p className="mt-3 text-xs text-muted">{RISK_METHOD}</p>
          <p className="mt-3 text-sm"><strong>What could go wrong:</strong> weather, disease or pests, price falls, delays, buyer non-payment and cost overruns can each reduce a project’s results. {COPY.noGuarantee}</p>
        </Section>

        <Section title="Project documents" defaultOpen={false}>
          {p.documentTitles.length === 0 ? <Empty>No documents uploaded.</Empty> : <ul className="space-y-2">{p.documentTitles.map((t) => (<li key={t}><button type="button" onClick={() => setDoc(t)} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-700 hover:underline"><FileText className="size-4" aria-hidden /> {t}</button></li>))}</ul>}
          {p.updates.length > 0 && <ul className="mt-4 space-y-3 border-t border-line pt-4">{p.updates.map((u) => (<li key={u.id} className="text-sm"><p className="font-semibold">{u.title} <span className="font-normal text-muted">· {formatDate(u.date)}</span></p><p className="text-muted">{u.body}</p></li>))}</ul>}
          {history.length > 0 && <><h3 className="mb-1 mt-4 text-sm font-semibold">Recent activity (illustrative)</h3><ul className="divide-y divide-line text-sm">{history.map((a) => <li key={a.id} className="flex flex-wrap justify-between gap-2 py-2"><span>{a.activity}</span><span className="text-muted">{formatDate(a.date)} · {a.status}</span></li>)}</ul></>}
        </Section>
      </div>

      <p className="text-xs"><Link href={`/projects/${p.id}`} className="font-semibold text-[#2E7D32] hover:underline">Open full project page →</Link></p>
      <DemoDocumentPreview open={doc !== null} onClose={() => setDoc(null)} title={doc ?? ""} category="project document" />
    </section>
  );
}
