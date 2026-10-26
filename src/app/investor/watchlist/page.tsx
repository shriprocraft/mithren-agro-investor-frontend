"use client";

import { EmptyState, LinkButton, PageTitle } from "@/components/common/ui";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { useToast } from "@/components/common/feedback";
import { useDemo } from "@/context/DemoContext";
import { useInvestor } from "@/hooks/useInvestor";
import { toggleWatchlist } from "@/lib/mock-service";
import { projectById } from "@/lib/project-helpers";

export default function WatchlistPage() {
  const { state, user, run } = useDemo();
  const d = useInvestor();
  const toast = useToast();
  const projects = d.watchlist.map((id) => projectById(state, id)).filter((p) => !!p);
  if (!user) return null;
  return (
    <>
      <PageTitle title="Watchlist" subtitle="Projects you saved. Stored locally in this demo." actions={<LinkButton href="/projects" variant="secondary">Find more projects</LinkButton>} />
      {projects.length === 0 ? <EmptyState title="Your watchlist is empty" body="Use the Save button on any project to keep it here." action={<LinkButton href="/projects">Browse projects</LinkButton>} /> : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => <ProjectCard key={p!.id} project={p!} saved onToggleSave={() => { run((s) => toggleWatchlist(s, user.id, p!.id)); toast("Removed from your watchlist.", "ok"); }} />)}
        </div>
      )}
    </>
  );
}
