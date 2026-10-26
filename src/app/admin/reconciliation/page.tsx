"use client";

import { Button, Badge, Callout, PageTitle, StatCard } from "@/components/common/ui";
import { CurrencyAmount } from "@/components/common/badges";
import { DataTable, type Column } from "@/components/common/DataTable";
import { useToast } from "@/components/common/feedback";
import { useDemo } from "@/context/DemoContext";
import { MISSING } from "@/lib/format";
import { resolveReconException, runReconciliation } from "@/lib/mock-service";
import type { ReconEntry } from "@/types";

const TONE = { matched: "ok", unmatched: "warn", exception: "bad" } as const;
const LABEL = { matched: "Matched", unmatched: "Unmatched (pending)", exception: "Exception" } as const;

export default function AdminReconciliation() {
  const { state, run, actor } = useDemo();
  const toast = useToast();
  const count = (s: ReconEntry["status"]) => state.recon.filter((r) => r.status === s).length;
  const columns: Column<ReconEntry>[] = [
    { key: "tx", header: "Internal transaction", sort: (r) => r.txId, cell: (r) => <span className="font-semibold">{r.txId}</span> },
    { key: "ref", header: "Demo provider ref", cell: (r) => r.ref },
    { key: "i", header: "Internal", className: "text-right", cell: (r) => <CurrencyAmount value={r.internalAmount} /> },
    { key: "p", header: "Provider", className: "text-right", cell: (r) => (r.providerAmount === null ? MISSING : <CurrencyAmount value={r.providerAmount} />) },
    { key: "s", header: "Status", sort: (r) => r.status, cell: (r) => <Badge tone={TONE[r.status]}>{LABEL[r.status]}</Badge> },
    { key: "n", header: "Note", cell: (r) => r.note },
    { key: "a", header: "", cell: (r) => (r.status === "exception" ? <Button variant="secondary" className="min-h-9" onClick={() => { const x = run((s) => resolveReconException(s, r.id, actor)); toast(x.ok ? "Exception resolved (demo)." : x.error, x.ok ? "ok" : "bad"); }}>Resolve</Button> : null) },
  ];
  return (
    <>
      <PageTitle title="Reconciliation (demo)" subtitle="Mock ledger vs. a fictional provider feed. Never connected to a real bank or provider." actions={<Button onClick={() => { const r = run((s) => runReconciliation(s, actor)); if (r.ok) toast(`Demo reconciliation: ${r.data.added} new entries, ${r.data.matched} matched.`, "ok"); }}>Run demo reconciliation</Button>} />
      <div className="grid gap-4 sm:grid-cols-3"><StatCard label="Matched" value={count("matched")} /><StatCard tone="pending" label="Unmatched (pending)" value={count("unmatched")} /><StatCard tone="pending" label="Exceptions" value={count("exception")} /></div>
      <div className="mt-6"><DataTable caption="Reconciliation entries" rows={state.recon} columns={columns} rowKey={(r) => r.id} searchText={(r) => `${r.txId} ${r.ref} ${r.status}`} emptyTitle="No reconciliation entries" emptyBody="Run a demo reconciliation to generate entries." /></div>
      <Callout tone="info" className="mt-4">Running reconciliation creates entries for transactions that don’t have one yet, and matches pending ones after they settle. Exceptions need a manual resolution.</Callout>
    </>
  );
}
