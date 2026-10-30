"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/common/feedback";
import { Button } from "@/components/common/ui";
import { EnquiryModal, type EnquiryPrefill } from "@/components/plans/EnquiryModal";
import { InvestPanel } from "@/components/projects/InvestPanel";
import { useDemo } from "@/context/DemoContext";
import { formatINR } from "@/lib/format";
import { durationLabel, frequencyOf } from "@/lib/investment-schedule";
import { toggleWatchlist } from "@/lib/mock-service";
import type { Project } from "@/types";

/** Right-hand investment panel for the selected project. Keyed by project id so amount and validation reset on switch. */
export function ProjectSidePanel({ project: p }: { project: Project }) {
  const { state, session, run } = useDemo();
  const router = useRouter();
  const toast = useToast();
  const [enquiry, setEnquiry] = useState<EnquiryPrefill | null>(null);
  const saved = !!session && (state.watchlist[session.userId] ?? []).includes(p.id);

  const onToggle = () => {
    if (!session) { router.push(`/login?next=${encodeURIComponent(`/projects?project=${p.id}`)}`); return; }
    if (session.role !== "investor") { toast("Wishlists are available to investor accounts.", "warn"); return; }
    const r = run((s) => toggleWatchlist(s, session.userId, p.id));
    if (r.ok) toast(r.data ? "Saved to your wishlist." : "Removed from your wishlist.", "ok");
  };

  return (
    <div className="space-y-3">
      <InvestPanel key={p.id} project={p} role={session?.role ?? null} isSaved={saved} onToggleSave={onToggle}
        onEnquire={(s) => setEnquiry({
          projectId: p.id, amount: s.amount,
          heading: `${p.title} — ${formatINR(s.amount)}, ${frequencyOf(s.frequency).label.toLowerCase()} for ${durationLabel(s.frequency, s.duration)}`,
          message: `Preferred schedule: ${frequencyOf(s.frequency).label} for ${durationLabel(s.frequency, s.duration)}.`,
        })} />
      <Button className="w-full" variant="secondary" onClick={() => setEnquiry({ projectId: p.id, heading: p.title })}>Enquire About This Project</Button>
      <EnquiryModal open={enquiry !== null} onClose={() => setEnquiry(null)} prefill={enquiry ?? {}} />
    </div>
  );
}
