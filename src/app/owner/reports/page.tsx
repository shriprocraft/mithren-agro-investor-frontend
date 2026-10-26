"use client";

import { Callout, Card, EmptyState, PageTitle } from "@/components/common/ui";
import { ForecastTag } from "@/components/common/badges";
import { useOwner } from "@/hooks/useOwner";
import { computeScenario, costBreakdown } from "@/lib/analysis-calculations";
import { formatINR, formatNumber, formatSignedINR } from "@/lib/format";

export default function OwnerReports() {
  const o = useOwner();
  const withAnalysis = o.projects.filter((p) => p.analysis);
  return (
    <>
      <PageTitle title="Reports" subtitle="Sample progress and budget reports. Forecasts and actuals are shown separately." />
      {withAnalysis.length === 0 ? <EmptyState title="No reports yet" body="Reports appear once a project has production and cost assumptions." /> : (
        <div className="space-y-5">
          {withAnalysis.map((p) => {
            const a = p.analysis!;
            const base = computeScenario(a);
            const cb = costBreakdown(a);
            const done = p.milestones.filter((m) => m.status === "done").length;
            return (
              <Card key={p.id}>
                <h2 className="text-lg font-bold text-brand-900">{p.title}</h2>
                <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[28rem] text-sm"><caption className="sr-only">Forecast versus actual for {p.title}</caption>
                  <thead className="text-left text-xs uppercase text-muted"><tr><th className="py-2">Measure</th><th className="py-2 text-right">Forecast <ForecastTag kind="forecast" /></th><th className="py-2 text-right">Actual <ForecastTag kind="actual" /></th></tr></thead>
                  <tbody>
                    <tr className="border-t border-line"><th scope="row" className="py-2 text-left font-medium">Saleable output</th><td className="tabular py-2 text-right">{formatNumber(base.saleableQty, a.qtyUnit)}</td><td className="tabular py-2 text-right">{a.actuals ? formatNumber(a.actuals.qty, a.qtyUnit) : "Not reported"}</td></tr>
                    <tr className="border-t border-line"><th scope="row" className="py-2 text-left font-medium">Total cost</th><td className="tabular py-2 text-right">{formatINR(cb.total)}</td><td className="tabular py-2 text-right">{a.actuals ? formatINR(a.actuals.totalCost) : "Not reported"}</td></tr>
                    <tr className="border-t border-line"><th scope="row" className="py-2 text-left font-medium">Project surplus / (deficit)</th><td className="tabular py-2 text-right">{base.surplus === null ? "Not available in demo data" : formatSignedINR(base.surplus)}</td><td className="tabular py-2 text-right">{a.actuals ? formatSignedINR(a.actuals.qty * a.actuals.avgPrice - a.actuals.totalCost) : "Not reported"}</td></tr>
                    <tr className="border-t border-line"><th scope="row" className="py-2 text-left font-medium">Milestones completed</th><td className="tabular py-2 text-right">{p.milestones.length}</td><td className="tabular py-2 text-right">{done}</td></tr>
                  </tbody></table></div>
                {a.actuals && <p className="mt-2 text-xs text-muted">{a.actuals.label} Actual surplus ignores sales deductions in this simple demo view.</p>}
              </Card>
            );
          })}
        </div>
      )}
      <Callout tone="info" className="mt-6">Actual figures you report are labelled “self-reported” until a reviewer checks them. Edits after submission create an audit event in a live product.</Callout>
    </>
  );
}
