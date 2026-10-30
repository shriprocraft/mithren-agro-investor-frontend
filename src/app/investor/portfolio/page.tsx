"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Callout, EmptyState, LinkButton, PageTitle, SelectField } from "@/components/common/ui";
import { CurrencyAmount, GainLossValue } from "@/components/common/badges";
import { DataTable, type Column } from "@/components/common/DataTable";
import { PrimaryCards } from "@/components/dashboard/sections";
import { categoryLabel, durationLabel, INVESTMENT_STATUS_LABEL as INV_STATUS } from "@/config/demo-config";
import { useDemo } from "@/context/DemoContext";
import { useInvestor } from "@/hooks/useInvestor";
import { addMonths, totalReturn } from "@/lib/dashboard-calculations";
import { formatDate, formatINR, formatPercent, formatSignedINR } from "@/lib/format";
import { gainLoss, gainLossPercent, isOpenExit } from "@/lib/portfolio-calculations";
import { projectById } from "@/lib/project-helpers";
import type { MockInvestment } from "@/types";

export default function PortfolioPage() {
  const { state } = useDemo();
  const d = useInvestor();
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const rows = d.investments.filter((i) => (!status || i.status === status) && (!category || projectById(state, i.projectId)?.category === category));
  const proj = (i: MockInvestment) => projectById(state, i.projectId);
  // Planned end = purchase date + project duration (same rule as the dashboard's "nearing maturity").
  const plannedEnd = (i: MockInvestment) => { const p = proj(i); return p ? addMonths(i.purchasedAt, p.durationMonths).toISOString() : null; };
  const total = totalReturn(d.investments, d.exits);
  const allInvested = d.investments.reduce((s, i) => s + i.originalAmount, 0);

  const columns: Column<MockInvestment>[] = [
    { key: "project", header: "Project", sort: (i) => proj(i)?.title ?? "", cell: (i) => (<div className="min-w-0"><Link href={`/investor/portfolio/${i.id}`} className="font-semibold text-brand-800 hover:underline">{proj(i)?.title ?? "Unknown project"}</Link><span className="block text-xs text-muted">{[proj(i) && categoryLabel(proj(i)!.category), proj(i)?.location, i.id].filter(Boolean).join(" · ")}</span></div>) },
    { key: "orig", header: "Original amount", sort: (i) => i.originalAmount, className: "text-right", cell: (i) => <CurrencyAmount value={i.originalAmount} /> },
    { key: "cur", header: "Est. value", sort: (i) => i.currentEstimatedValue, className: "text-right", cell: (i) => <CurrencyAmount value={i.currentEstimatedValue} /> },
    { key: "gl", header: "Est. return", sort: (i) => gainLoss(i.currentEstimatedValue, i.originalAmount), cell: (i) => i.status === "exited_demo" ? <span className="text-muted">Exited</span> : <GainLossValue amount={gainLoss(i.currentEstimatedValue, i.originalAmount)} percent={gainLossPercent(i.currentEstimatedValue, i.originalAmount)} /> },
    { key: "dur", header: "Duration", sort: (i) => proj(i)?.durationMonths ?? 0, cell: (i) => (proj(i) ? durationLabel(proj(i)!.durationMonths) : "—") },
    { key: "bought", header: "Invested on", sort: (i) => i.purchasedAt, cell: (i) => formatDate(i.purchasedAt) },
    { key: "end", header: "Planned end", sort: (i) => plannedEnd(i) ?? "", cell: (i) => { const e = plannedEnd(i); return e ? formatDate(e) : "—"; } },
    { key: "asof", header: "Valued as of", sort: (i) => i.valuationAsOf, cell: (i) => formatDate(i.valuationAsOf) },
    { key: "status", header: "Status", cell: (i) => (<div className="flex flex-wrap gap-1"><Badge tone={i.status === "exited_demo" ? "neutral" : "ok"}>{INV_STATUS[i.status]}</Badge>{state.exits.some((e) => e.investmentId === i.id && isOpenExit(e)) && <Badge tone="warn">Exit pending</Badge>}</div>) },
    { key: "view", header: "", cell: (i) => <LinkButton variant="secondary" href={`/investor/portfolio/${i.id}`} className="min-h-9">View</LinkButton> },
  ];

  const cats = [...new Set(d.investments.map((i) => proj(i)?.category).filter(Boolean))] as NonNullable<ReturnType<typeof proj>>["category"][];

  return (
    <>
      <PageTitle title="Portfolio" subtitle="Simulated positions. “Estimated value” is a sample valuation, not a sale price." actions={<LinkButton href="/projects">Explore projects</LinkButton>} />
      {d.investments.length === 0 ? (
        <EmptyState title="Your portfolio is empty" body="Simulate your first investment — ₹100 works on projects configured for it." action={<LinkButton href="/projects">Browse projects</LinkButton>} />
      ) : (
        <>
          <PrimaryCards s={d.summary} />
          <p className="mb-6 mt-3 text-sm text-muted">
            {d.investments.length} position{d.investments.length === 1 ? "" : "s"} in total ({formatINR(allInvested)} originally invested, including exited positions).
            {" "}Total return (realised + unrealised): <span className="font-semibold text-ink">{formatSignedINR(total.amount)} ({formatPercent(total.pct, 2, true)})</span> — estimate, not guaranteed.
          </p>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{Object.entries(INV_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</SelectField>
            <SelectField label="Category" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option>{cats.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}</SelectField>
          </div>
          <DataTable caption="Portfolio positions" rows={rows} columns={columns} rowKey={(i) => i.id} searchText={(i) => `${proj(i)?.title ?? ""} ${i.id}`} emptyTitle="No positions match these filters" />
          <Callout tone="info" className="mt-4">Original amount = what you simulated. Current estimated value = sample valuation. Realised proceeds only appear after a simulated exit reaches “Settled (demo)”.</Callout>
        </>
      )}
    </>
  );
}
