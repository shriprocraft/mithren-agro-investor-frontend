"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { Button, LoadingPage, PageTitle, SelectField, Callout } from "@/components/common/ui";
import { CurrencyAmount, TransactionStatusBadge } from "@/components/common/badges";
import { DataTable, type Column } from "@/components/common/DataTable";
import { TX_STATUS_LABEL } from "@/config/demo-config";
import { useDemo } from "@/context/DemoContext";
import { formatDateTime } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import type { MockTransaction } from "@/types";

function Inner() {
  const { state } = useDemo();
  const q = useSearchParams().get("q") ?? "";
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const user = (id: string) => state.users.find((u) => u.id === id)?.name ?? id;
  const rows = state.transactions.filter((t) => (!type || t.type === type) && (!status || t.status === status));
  const columns: Column<MockTransaction>[] = [
    { key: "id", header: "Reference", sort: (t) => t.id, cell: (t) => <span className="font-semibold">{t.id}</span> },
    { key: "d", header: "Date", sort: (t) => t.createdAt, cell: (t) => formatDateTime(t.createdAt) },
    { key: "u", header: "User", cell: (t) => user(t.userId) },
    { key: "t", header: "Type", cell: (t) => <span className="capitalize">{t.type}</span> },
    { key: "a", header: "Amount", sort: (t) => t.amount, className: "text-right", cell: (t) => <CurrencyAmount value={t.amount} /> },
    { key: "s", header: "Status", cell: (t) => <TransactionStatusBadge status={t.status} /> },
  ];
  return (
    <>
      <PageTitle title="Transactions" subtitle="All simulated transactions across demo users." actions={<Button variant="secondary" onClick={() => downloadCsv("demo-transactions.csv", ["Reference", "Created", "User", "Type", "Amount INR", "Status"], rows.map((t) => [t.id, t.createdAt, user(t.userId), t.type, t.amount, TX_STATUS_LABEL[t.status]]))}><Download className="size-4" aria-hidden /> Export CSV (demo)</Button>} />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SelectField label="Type" value={type} onChange={(e) => setType(e.target.value)}><option value="">All types</option><option value="investment">Investment</option><option value="exit">Exit</option><option value="withdrawal">Withdrawal</option></SelectField>
        <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{Object.entries(TX_STATUS_LABEL).filter(([k]) => state.transactions.some((t) => t.status === k)).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</SelectField>
      </div>
      <DataTable key={q} initialQuery={q} caption="All transactions" rows={rows} columns={columns} rowKey={(t) => t.id} searchText={(t) => `${t.id} ${t.type} ${user(t.userId)} ${t.status}`} emptyTitle="No transactions" pageSize={10} />
      <Callout tone="info" className="mt-4">The export is generated in your browser from demo data.</Callout>
    </>
  );
}

export default function AdminTransactions() {
  return <Suspense fallback={<LoadingPage />}><Inner /></Suspense>;
}
