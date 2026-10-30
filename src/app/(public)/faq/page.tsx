import type { Metadata } from "next";
import { FaqAccordion } from "@/components/common/FaqAccordion";
import { faqs } from "@/content/faq";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">FAQ</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">Frequently asked questions</h1>
      <p className="mt-2 text-sm text-muted">Placeholder answers for the prototype — not legal or investment advice.</p>
      <FaqAccordion items={faqs} className="mt-8" />
    </div>
  );
}
