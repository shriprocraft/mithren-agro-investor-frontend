"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Callout, Card, DefList, PageTitle, TextField } from "@/components/common/ui";
import { ConfirmationDialog, useToast } from "@/components/common/feedback";
import { DEMO_CONFIG } from "@/config/demo-config";
import { useDemo } from "@/context/DemoContext";
import { applyValuationUpdate } from "@/lib/mock-service";
import { parseAmount } from "@/lib/validation";

export default function AdminSettings() {
  const { run, actor, resetDemo } = useDemo();
  const toast = useToast();
  const router = useRouter();
  const [pct, setPct] = useState("2");
  const [err, setErr] = useState<string>();
  const [confirm, setConfirm] = useState(false);

  const apply = (sign: 1 | -1) => {
    const p = parseAmount(pct);
    if (!p.ok) return setErr(p.error);
    setErr(undefined);
    const r = run((s) => applyValuationUpdate(s, sign * p.value, actor));
    toast(r.ok ? `Sample valuation updated on ${r.data} open position(s).` : r.error, r.ok ? "ok" : "bad");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <PageTitle title="Demo settings" subtitle="Non-sensitive prototype controls." />
      <Card>
        <h2 className="mb-2 text-lg font-bold text-brand-900">Simulate a valuation update</h2>
        <p className="mb-3 text-sm text-muted">Applies a sample % change to every open investment and adds a point to each valuation history. Demo data only.</p>
        <div className="flex flex-wrap items-end gap-3"><div className="w-40"><TextField label="Change (%)" inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value)} error={err} /></div><Button onClick={() => apply(1)}>Apply increase</Button><Button variant="secondary" onClick={() => apply(-1)}>Apply decrease</Button></div>
      </Card>
      <Card>
        <h2 className="mb-3 text-lg font-bold text-brand-900">Configured demo assumptions</h2>
        <DefList rows={[["Illustrative exit fee", `${DEMO_CONFIG.exitFeePct}%`], ["Prototype test amount", `₹${DEMO_CONFIG.testAmount}`], ["Quick amounts", DEMO_CONFIG.quickAmounts.map((a) => `₹${a}`).join(", ")]]} />
        <p className="mt-3 text-xs text-muted">Edit these in <code>src/config/demo-config.ts</code>. None is an approved business rule.</p>
      </Card>
      <Card>
        <h2 className="mb-2 text-lg font-bold text-brand-900">Reset</h2>
        <p className="mb-3 text-sm text-muted">Restore all seeded records and remove demo records created in this browser.</p>
        <Button variant="danger" onClick={() => setConfirm(true)}>Reset demo data</Button>
      </Card>
      <Callout tone="info">Role switching and resets are prototype conveniences, not security controls.</Callout>
      <ConfirmationDialog open={confirm} danger title="Reset demo data?" body="This cannot be undone." confirmLabel="Reset" onCancel={() => setConfirm(false)} onConfirm={() => { resetDemo(); setConfirm(false); toast("Demo data restored.", "ok"); router.push("/admin/dashboard"); }} />
    </div>
  );
}
