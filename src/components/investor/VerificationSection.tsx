"use client";

import { Button, Callout, Card, LinkButton } from "@/components/common/ui";
import { VerificationBadge } from "@/components/common/badges";
import { useToast } from "@/components/common/feedback";
import { useDemo } from "@/context/DemoContext";
import { setChecklistItem, submitVerification } from "@/lib/mock-service";

export function VerificationSection() {
  const { user, run } = useDemo();
  const toast = useToast();
  if (!user) return null;
  const editable = ["not_started", "draft", "action_required", "rejected_demo"].includes(user.verification);
  const itemEditable = (s: string) => ["not_started", "draft", "action_required", "rejected_demo"].includes(s);
  return (
    <section id="verification" aria-labelledby="verification-heading" className="scroll-mt-20">
      <h2 id="verification-heading" className="mb-1 text-xl font-bold text-brand-900">Verification</h2>
      <p className="mb-4 text-sm text-muted">Overall demo status: <VerificationBadge status={user.verification} /></p>
      <Callout tone="neutral" className="mb-4" title="Simulated checks only">No real KYC, identity or bank verification happens. “Approved (demo)” does not authorise a real investment.</Callout>
      <Card className="p-6!">
        <ul className="divide-y divide-line">
          {user.checklist.map((c) => (
            <li key={c.label} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span className="text-sm font-semibold">{c.label}</span>
              <span className="flex items-center gap-2"><VerificationBadge status={c.status} />
                {itemEditable(c.status) && c.label.startsWith("Identity") && <Button variant="secondary" className="min-h-9" onClick={() => { run((s) => setChecklistItem(s, user.id, c.label, "submitted")); toast("Marked as submitted (demo). No file was uploaded.", "ok"); }}>Mark as submitted</Button>}
                {itemEditable(c.status) && c.label.startsWith("Bank") && <LinkButton variant="secondary" href="#bank-details" className="min-h-9">Add details</LinkButton>}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button disabled={!editable} title={editable ? undefined : "Already submitted for demo review"} onClick={() => { const r = run((s) => submitVerification(s, user.id)); toast(r.ok ? "Submitted for demo review." : r.error, r.ok ? "ok" : "bad"); }}>Submit for demo review</Button>
          <LinkButton variant="secondary" href="/investor/onboarding">Open onboarding wizard</LinkButton>
        </div>
        {!editable && <p className="mt-2 text-xs text-muted">Already submitted — an admin can action it in the demo admin workspace.</p>}
      </Card>
    </section>
  );
}
