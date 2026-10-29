"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/common/feedback";
import { Button } from "@/components/common/ui";
import { EnquiryModal } from "@/components/plans/EnquiryModal";
import { InvestPanel } from "@/components/projects/InvestPanel";
import { useDemo } from "@/context/DemoContext";
import { toggleWatchlist } from "@/lib/mock-service";
import type { Project } from "@/types";

/** Right-hand investment panel for the selected project. Keyed by project id so amount and validation reset on switch. */
export function ProjectSidePanel({ project: p }: { project: Project }) {
  const { state, session, run } = useDemo();
  const router = useRouter();
  const toast = useToast();
  const [enquire, setEnquire] = useState(false);
  const saved = !!session && (state.watchlist[session.userId] ?? []).includes(p.id);

  const onToggle = () => {
    if (!session) { router.push(`/login?next=${encodeURIComponent(`/projects?project=${p.id}`)}`); return; }
    if (session.role !== "investor") { toast("Watchlists are available to investor accounts.", "warn"); return; }
    const r = run((s) => toggleWatchlist(s, session.userId, p.id));
    if (r.ok) toast(r.data ? "Saved to your watchlist." : "Removed from your watchlist.", "ok");
  };

  return (
    <div className="space-y-3">
      <InvestPanel key={p.id} project={p} role={session?.role ?? null} isSaved={saved} onToggleSave={onToggle} />
      <Button className="w-full" variant="secondary" onClick={() => setEnquire(true)}>Enquire About This Project</Button>
      <EnquiryModal open={enquire} onClose={() => setEnquire(false)} prefill={{ projectId: p.id, heading: p.title }} />
    </div>
  );
}
