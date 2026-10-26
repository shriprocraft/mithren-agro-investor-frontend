"use client";

import Link from "next/link";
import { useState } from "react";
import { PageTitle, SelectField, Callout } from "@/components/common/ui";
import { CurrencyAmount, TransactionStatusBadge } from "@/components/common/badges";
import { DataTable, type Column } from "@/components/common/DataTable";
import { TX_STATUS_LABEL } from "@/config/demo-config";
import { useDemo } from "@/context/DemoContext";
import { useInvestor } from "@/hooks/useInvestor";
import { formatDateTime } from "@/lib/format";
import { projectById } from "@/lib/project-helpers";
import type { MockTransaction } from "@/types";

export default function TransactionsPage() {
  const { state } = useDemo();
  const d = useInvestor();
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const rows = d.transactions.filter((t) => (!type || t.type === type) && (!status || t.status === status));
  const columns: Column<MockTransaction>[] = [
    { key: "ref", header: "Reference", sort: (t) => t.id, cell: (t) => <Link href={`/investor/transactions/${t.id}`} className="font-semibold text-brand-800 hover:underline">{t.id}</Link> },
    { key: "date", header: "Date", sort: (t) => t.createdAt, cell: (t) => formatDateTime(t.createdAt) },
    { key: "type", header: "Type", cell: (t) => <span className="capitalize">{t.type}{t.type === "investment" ? " (demo)" : ""}</span> },
    { key: "proj", header: "Project", cell: (t) => (t.projectId ? projectById(state, t.projectId)?.title ?? "—" : "—") },
    { key: "amt", header: "Amount", sort: (t) => t.amount, className: "text-right", cell: (t) => <CurrencyAmount value={t.amount} /> },
    { key: "st", header: "Status", cell: (t) => <TransactionStatusBadge status={t.status} /> },
  ];
  return (
    <>
      <PageTitle title="Transactions" subtitle="All entries are simulated. Pending items are not settled." />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SelectField label="Type" value={type} onChange={(e) => setType(e.target.value)}><option value="">All types</option><option value="investment">Investment</option><option value="exit">Exit</option><option value="withdrawal">Withdrawal</option></SelectField>
        <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{Object.entries(TX_STATUS_LABEL).filter(([k]) => d.transactions.some((t) => t.status === k)).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</SelectField>
      </div>
      <DataTable caption="Transactions" rows={rows} columns={columns} rowKey={(t) => t.id} searchText={(t) => `${t.id} ${t.type} ${t.status} ${projectById(state, t.projectId ?? "")?.title ?? ""}`} emptyTitle="No transactions" emptyBody="Simulated investments, exits and withdrawals will appear here." />
      <Callout tone="info" className="mt-4">Refunds and reversals, when simulated, appear as new linked entries rather than edits to the original.</Callout>
    </>
  );
}
