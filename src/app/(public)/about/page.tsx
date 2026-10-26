import type { Metadata } from "next";
import { Callout } from "@/components/common/ui";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-brand-900">About this platform</h1>
      <div className="mt-4 space-y-4 text-muted">
        <p>This prototype explores a transparent way to connect eligible supporters with verified agriculture projects. The aim is for a person to be able to answer five questions before committing money:</p>
        <ol className="list-decimal space-y-1 pl-6 text-ink">
          <li>What is the project producing?</li>
          <li>How does it expect to earn revenue?</li>
          <li>What are the costs, assumptions, risks and evidence?</li>
          <li>What exactly am I entitled to receive, if anything?</li>
          <li>How will I track my money and the project’s progress?</li>
        </ol>
        <p>Principles: transparency first, no guaranteed outcomes, traceability, auditability, and keeping farm revenue, project profit, cash and investor distributions as clearly separate ideas.</p>
        <p>The prototype contains no approved brand copy, imagery or legal text. All placeholder wording is provisional and must be reviewed by legal, finance and compliance advisers before any real-money launch.</p>
      </div>
      <Callout tone="info" title="Status" className="mt-6">Frontend-only prototype. No backend, payments, KYC or payouts. All people, farms and figures are fictional.</Callout>
    </div>
  );
}
