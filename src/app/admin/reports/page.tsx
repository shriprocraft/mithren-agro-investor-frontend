"use client";

import { Download } from "lucide-react";
import { Button, Callout, Card, PageTitle } from "@/components/common/ui";
import { PROJECT_STATUS_LABEL, TX_STATUS_LABEL } from "@/config/demo-config";
import { useDemo } from "@/context/DemoContext";
import { fundingProgress } from "@/lib/analysis-calculations";
import { downloadCsv } from "@/lib/csv";
import { formatDateTime, formatINR } from "@/lib/format";
import { cashSummary } from "@/lib/portfolio-calculations";

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  return (<li className="flex items-center gap-3 text-sm"><span className="w-44 shrink-0 truncate">{label}</span><span className="h-3 flex-1 overflow-hidden rounded-full bg-earth-200"><span className="block h-full rounded-full bg-brand-500" style={{ width: `${max ? (value / max) * 100 : 0}%` }} /></span><span className="tabular w-8 text-right font-semibold">{value}</span></li>);
}

export default function AdminReports() {
  const { state } = useDemo();
  const byProject = Object.entries(PROJECT_STATUS_LABEL).map(([k, label]) => ({ label, n: state.projects.filter((p) => p.status === k).length })).filter((x) => x.n > 0);
  const byTx = Object.entries(TX_STATUS_LABEL).map(([k, label]) => ({ label, n: state.transactions.filter((t) => t.status === k).length })).filter((x) => x.n > 0);
  const investors = state.users.filter((u) => u.role === "investor");
  const asOf = formatDateTime(new Date().toISOString());
  return (
    <>
      <PageTitle title="Reports (sample)" subtitle={`Generated in your browser from demo data · ${asOf} · currency INR`} actions={
        <>
          <Button variant="secondary" onClick={() => downloadCsv("demo-projects.csv", ["Project", "Status", "Sample target INR", "Sample raised INR", "Funding %"], state.projects.map((p) => [p.title, PROJECT_STATUS_LABEL[p.status], p.funding?.target ?? "", p.funding?.raised ?? "", fundingProgress(p.funding) ?? ""]))}><Download className="size-4" aria-hidden /> Projects CSV</Button>
          <Button variant="secondary" onClick={() => downloadCsv("demo-cash.csv", ["Investor", "Settled available INR", "Pending proceeds INR", "Pending withdrawals INR"], investors.map((u) => { const c = cashSummary(u.id, state.cash, state.exits, state.withdrawals); return [u.name, c.available, c.pendingProceeds, c.pendingWithdrawals]; }))}><Download className="size-4" aria-hidden /> Cash CSV</Button>
        </>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><h2 className="mb-3 text-lg font-bold text-brand-900">Projects by lifecycle status</h2><ul className="space-y-2" aria-label="Projects by status">{byProject.map((x) => <Bar key={x.label} label={x.label} value={x.n} max={state.projects.length} />)}</ul></Card>
        <Card><h2 className="mb-3 text-lg font-bold text-brand-900">Transactions by status</h2>{byTx.length === 0 ? <p className="text-sm text-muted">No transactions.</p> : <ul className="space-y-2" aria-label="Transactions by status">{byTx.map((x) => <Bar key={x.label} label={x.label} value={x.n} max={state.transactions.length} />)}</ul>}</Card>
        <Card className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-bold text-brand-900">Sample funding by project</h2>
          <div className="overflow-x-auto"><table className="w-full min-w-[32rem] text-sm"><caption className="sr-only">Sample funding by project</caption><thead className="text-left text-xs uppercase text-muted"><tr><th className="py-2">Project</th><th className="py-2 text-right">Target</th><th className="py-2 text-right">Raised</th><th className="py-2 text-right">%</th></tr></thead>
            <tbody>{state.projects.filter((p) => p.funding && p.funding.target > 0 && ["approved_demo", "active_demo", "completed_demo"].includes(p.status)).map((p) => (<tr key={p.id} className="border-t border-line"><th scope="row" className="py-2 text-left font-medium">{p.title}</th><td className="tabular py-2 text-right">{formatINR(p.funding!.target)}</td><td className="tabular py-2 text-right">{formatINR(p.funding!.raised)}</td><td className="tabular py-2 text-right">{fundingProgress(p.funding)}%</td></tr>))}</tbody></table></div>
        </Card>
      </div>
      <Callout tone="info" className="mt-6">Definitions: funding = sample amount recorded against a project; cash = settled demo cash only. Forecast and actual figures are never combined in one series.</Callout>
    </>
  );
}
