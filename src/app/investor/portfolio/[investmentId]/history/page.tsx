"use client";

import { useParams } from "next/navigation";
import { Breadcrumbs, Callout, EmptyState, LinkButton, PageTitle } from "@/components/common/ui";
import { ValuationChart } from "@/components/analysis/ValuationChart";
import { DataTable, type Column } from "@/components/common/DataTable";
import { CurrencyAmount } from "@/components/common/badges";
import { DEMO_CONFIG } from "@/config/demo-config";
import { useDemo } from "@/context/DemoContext";
import { useInvestor } from "@/hooks/useInvestor";
import { formatDate, formatSignedINR, MISSING } from "@/lib/format";
import { projectById } from "@/lib/project-helpers";

type Row = { date: string; value: number; change: number | null; note?: string };

export default function ValuationHistoryPage() {
  const { investmentId } = useParams<{ investmentId: string }>();
  const { state } = useDemo();
  const d = useInvestor();
  const inv = d.investments.find((i) => i.id === investmentId);
  if (!inv) return <EmptyState title="Investment not found" action={<LinkButton href="/investor/portfolio">Back to portfolio</LinkButton>} />;
  const pts = state.valuations[inv.id] ?? [];
  const rows: Row[] = pts.map((p, i) => ({ ...p, change: i === 0 ? null : Math.round((p.value - pts[i - 1].value) * 100) / 100 })).reverse();
  const columns: Column<Row>[] = [
    { key: "date", header: "Date", sort: (r) => r.date, cell: (r) => formatDate(r.date) },
    { key: "value", header: "Sample est. value", className: "text-right", cell: (r) => <CurrencyAmount value={r.value} /> },
    { key: "chg", header: "Change vs previous", className: "text-right", cell: (r) => (r.change === null ? MISSING : <span className="tabular">{formatSignedINR(r.change)}</span>) },
    { key: "note", header: "Note", cell: (r) => r.note ?? MISSING },
  ];
  return (
    <>
      <Breadcrumbs items={[{ label: "Portfolio", href: "/investor/portfolio" }, { label: inv.id, href: `/investor/portfolio/${inv.id}` }, { label: "Valuation history" }]} />
      <PageTitle title="Valuation history" subtitle={projectById(state, inv.projectId)?.title} />
      <ValuationChart points={pts} title="Sample estimated value" />
      <div className="mt-6"><DataTable caption="Valuation history table" rows={rows} columns={columns} rowKey={(r) => r.date + r.value} emptyTitle="No valuation history in the demo data" /></div>
      <Callout tone="neutral" className="mt-4">{DEMO_CONFIG.valuationMethodNote} The series is a small illustrative set, not live prices. Drops in value on partial-exit dates reflect the position getting smaller.</Callout>
    </>
  );
}
