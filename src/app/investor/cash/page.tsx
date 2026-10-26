"use client";

import { Callout, Card, LinkButton, PageTitle, StatCard } from "@/components/common/ui";
import { CurrencyAmount } from "@/components/common/badges";
import { DataTable, type Column } from "@/components/common/DataTable";
import { useInvestor } from "@/hooks/useInvestor";
import { formatDateTime, formatSignedINR } from "@/lib/format";
import type { CashEntry, CashEntryKind } from "@/types";

const KIND: Record<CashEntryKind, string> = {
  demo_opening_balance: "Demo opening balance",
  exit_settlement: "Exit proceeds settled",
  withdrawal_hold: "Withdrawal reserved",
  withdrawal_release: "Reserve released",
  withdrawal_paid: "Withdrawal paid (demo)",
};

export default function CashPage() {
  const d = useInvestor();
  const rows = [...d.cashEntries].sort((a, b) => b.at.localeCompare(a.at));
  const columns: Column<CashEntry>[] = [
    { key: "at", header: "Date", sort: (r) => r.at, cell: (r) => formatDateTime(r.at) },
    { key: "kind", header: "Event", cell: (r) => <div><span className="font-semibold">{KIND[r.kind]}</span><span className="block text-xs text-muted">{r.note}</span></div> },
    { key: "ref", header: "Reference", cell: (r) => r.refId ?? "—" },
    { key: "delta", header: "Change to available", className: "text-right", cell: (r) => <span className="tabular font-semibold">{r.availableDelta === 0 ? "No change" : formatSignedINR(r.availableDelta)}</span> },
  ];
  return (
    <>
      <PageTitle title="Cash balance" subtitle="Settled demo cash is separate from the estimated value of your investments." actions={<LinkButton href="/investor/withdraw">Withdraw cash</LinkButton>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Settled available cash" value={<CurrencyAmount value={d.cash.available} />} note="You can request to withdraw this" />
        <StatCard tone="pending" label="Pending sale proceeds" value={<CurrencyAmount value={d.cash.pendingProceeds} />} note="Not withdrawable until Settled (demo)" />
        <StatCard tone="pending" label="Pending withdrawals" value={<CurrencyAmount value={d.cash.pendingWithdrawals} />} note="Already deducted from available cash" />
      </div>
      <Card className="mt-4"><p className="text-sm text-muted">Estimated portfolio value (separate, not cash): <span className="tabular font-bold text-ink"><CurrencyAmount value={d.summary.value} /></span></p></Card>
      <Callout tone="info" className="mt-4" title="Three different actions">
        <ul className="list-disc pl-5"><li><strong>Withdraw available cash</strong> — uses settled cash above.</li><li><strong>Sell / redeem an investment</strong> — start from a portfolio position; proceeds stay pending until settled.</li><li><strong>Liquidate all, then withdraw</strong> — each position must complete its own exit first. There is no “withdraw all investments” shortcut.</li></ul>
      </Callout>
      <h2 className="mb-3 mt-8 text-lg font-bold text-brand-900">Cash activity (demo ledger)</h2>
      <DataTable caption="Cash ledger" rows={rows} columns={columns} rowKey={(r) => r.id} searchText={(r) => `${KIND[r.kind]} ${r.refId ?? ""} ${r.note}`} emptyTitle="No cash activity yet" emptyBody="Settled exit proceeds and withdrawals will appear here." />
    </>
  );
}
