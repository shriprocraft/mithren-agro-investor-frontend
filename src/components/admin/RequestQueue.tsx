"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Callout, SelectField, TextAreaField } from "@/components/common/ui";
import { CurrencyAmount, TransactionStatusBadge } from "@/components/common/badges";
import { DataTable, type Column } from "@/components/common/DataTable";
import { ConfirmationDialog, useToast } from "@/components/common/feedback";
import { TX_STATUS_LABEL } from "@/config/demo-config";
import { useDemo } from "@/context/DemoContext";
import { formatDateTime } from "@/lib/format";
import { transitionExit, transitionWithdrawal } from "@/lib/mock-service";
import { transitionsFor, TERMINAL } from "@/lib/mock-transitions";
import type { ExitRequest, TxStatus, WithdrawalRequest } from "@/types";

type Item = (ExitRequest | WithdrawalRequest) & { _kind: "exit" | "withdrawal" };
const NEGATIVE: TxStatus[] = ["rejected_demo", "cancelled_demo", "failed_demo"];
const VERB: Partial<Record<TxStatus, string>> = {
  under_review_demo: "Start review", approved_demo: "Approve", settlement_pending_demo: "Mark settlement pending", processing_demo: "Mark processing",
  settled_demo: "Mark settled", paid_demo: "Mark paid", rejected_demo: "Reject", cancelled_demo: "Cancel", failed_demo: "Mark failed",
};

export function RequestQueue({ kind }: { kind: "exit" | "withdrawal" }) {
  const { state, run, actor } = useDemo();
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState<{ item: Item; next: TxStatus } | null>(null);
  const [reason, setReason] = useState("");

  const source: Item[] = (kind === "exit" ? state.exits : state.withdrawals).map((x) => ({ ...x, _kind: kind }));
  const rows = source.filter((r) => !status || r.status === status);
  const userName = (id: string) => state.users.find((u) => u.id === id)?.name ?? id;
  const amountOf = (r: Item) => ("requestedValue" in r ? r.requestedValue : r.amount);

  const apply = () => {
    if (!pending) return;
    const { item, next } = pending;
    if (NEGATIVE.includes(next) && !reason.trim()) return;
    const r = run<unknown>((s) => (kind === "exit" ? transitionExit(s, item.id, next, actor, reason.trim() || undefined) : transitionWithdrawal(s, item.id, next, actor, reason.trim() || undefined)));
    toast(r.ok ? `${item.id} → ${TX_STATUS_LABEL[next]}` : r.error, r.ok ? "ok" : "bad");
    setPending(null);
    setReason("");
  };

  const columns: Column<Item>[] = [
    { key: "ref", header: "Reference", sort: (r) => r.id, cell: (r) => <Link href={`/admin/transactions?q=${r.txId}`} className="font-semibold text-brand-800 hover:underline">{r.id}</Link> },
    { key: "user", header: "User", sort: (r) => userName(r.userId), cell: (r) => userName(r.userId) },
    ...(kind === "exit" ? [{ key: "inv", header: "Investment", cell: (r: Item) => ("investmentId" in r ? r.investmentId : "—") } as Column<Item>] : [{ key: "dest", header: "Destination (masked)", cell: (r: Item) => ("maskedDestination" in r ? r.maskedDestination : "—") } as Column<Item>]),
    { key: "amt", header: kind === "exit" ? "Requested value" : "Amount", sort: amountOf, className: "text-right", cell: (r) => <CurrencyAmount value={amountOf(r)} /> },
    { key: "date", header: "Requested", sort: (r) => r.createdAt, cell: (r) => formatDateTime(r.createdAt) },
    { key: "st", header: "Status", cell: (r) => <TransactionStatusBadge status={r.status} /> },
    {
      key: "act", header: "Actions",
      cell: (r) => {
        const nexts = transitionsFor(kind)[r.status];
        if (TERMINAL.includes(r.status) || nexts.length === 0) return <span className="text-xs text-muted">Final — no actions</span>;
        return <div className="flex flex-wrap gap-1.5">{nexts.map((n) => (<Button key={n} variant={NEGATIVE.includes(n) ? "ghost" : "secondary"} className="min-h-9 px-3 text-xs" onClick={() => { setReason(""); setPending({ item: r, next: n }); }}>{VERB[n] ?? TX_STATUS_LABEL[n]}</Button>))}</div>;
      },
    },
  ];

  return (
    <>
      <div className="mb-4 max-w-xs"><SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{Object.entries(TX_STATUS_LABEL).filter(([k]) => source.some((s) => s.status === k)).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</SelectField></div>
      <DataTable caption={`${kind} requests`} rows={rows} columns={columns} rowKey={(r) => r.id} searchText={(r) => `${r.id} ${userName(r.userId)} ${r.status}`} emptyTitle="No requests" pageSize={10} />
      <Callout tone="info" className="mt-4">Only transitions allowed by the single demo transition table are offered; invalid transitions are also rejected by the service. Nothing here releases real money.</Callout>
      <ConfirmationDialog
        open={!!pending}
        danger={!!pending && NEGATIVE.includes(pending.next)}
        title={pending ? `${VERB[pending.next] ?? TX_STATUS_LABEL[pending.next]} ${pending.item.id}?` : ""}
        body={pending && kind === "exit" && pending.next === "settled_demo" ? "Marking this exit settled adds its net proceeds to the investor’s available cash exactly once and reduces the position." : pending && kind === "withdrawal" && NEGATIVE.includes(pending.next) ? "The reserved amount will be returned to the investor’s available cash exactly once." : undefined}
        confirmLabel={pending ? VERB[pending.next] ?? "Confirm" : "Confirm"}
        confirmDisabled={!!pending && NEGATIVE.includes(pending.next) && !reason.trim()}
        onCancel={() => setPending(null)}
        onConfirm={apply}
      >
        <TextAreaField label={pending && NEGATIVE.includes(pending.next) ? "Reason (required)" : "Note (optional)"} value={reason} onChange={(e) => setReason(e.target.value)} />
      </ConfirmationDialog>
    </>
  );
}
