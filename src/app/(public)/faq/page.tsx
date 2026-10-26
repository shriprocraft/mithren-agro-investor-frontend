import type { Metadata } from "next";
import { faqs } from "@/content/faq";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-brand-900">Frequently asked questions</h1>
      <p className="mt-2 text-sm text-muted">Placeholder answers for the prototype — not legal or investment advice.</p>
      <div className="mt-6 space-y-3">
        {faqs.map((f) => (
          <details key={f.q} className="rounded-card border border-line bg-white px-5 py-3 shadow-card">
            <summary className="min-h-8 cursor-pointer font-semibold text-brand-900">{f.q}</summary>
            <p className="mt-2 text-sm text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
