"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Callout, EmptyState, LinkButton, PageTitle, SelectField } from "@/components/common/ui";
import { CurrencyAmount, GainLossValue } from "@/components/common/badges";
import { DataTable, type Column } from "@/components/common/DataTable";
import { categoryLabel, INVESTMENT_STATUS_LABEL as INV_STATUS } from "@/config/demo-config";
import { useDemo } from "@/context/DemoContext";
import { useInvestor } from "@/hooks/useInvestor";
import { formatDate } from "@/lib/format";
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

  const columns: Column<MockInvestment>[] = [
    { key: "project", header: "Project", sort: (i) => proj(i)?.title ?? "", cell: (i) => (<div className="min-w-0"><Link href={`/investor/portfolio/${i.id}`} className="font-semibold text-brand-800 hover:underline">{proj(i)?.title ?? "Unknown project"}</Link><span className="block text-xs text-muted">{i.id}</span></div>) },
    { key: "orig", header: "Original amount", sort: (i) => i.originalAmount, className: "text-right", cell: (i) => <CurrencyAmount value={i.originalAmount} /> },
    { key: "cur", header: "Est. value", sort: (i) => i.currentEstimatedValue, className: "text-right", cell: (i) => <CurrencyAmount value={i.currentEstimatedValue} /> },
    { key: "gl", header: "Gain / loss", sort: (i) => gainLoss(i.currentEstimatedValue, i.originalAmount), cell: (i) => i.status === "exited_demo" ? <span className="text-muted">Exited</span> : <GainLossValue amount={gainLoss(i.currentEstimatedValue, i.originalAmount)} percent={gainLossPercent(i.currentEstimatedValue, i.originalAmount)} /> },
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
