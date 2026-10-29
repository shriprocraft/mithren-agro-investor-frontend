"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EmptyState, Skeleton } from "@/components/common/ui";
import { ProjectBrowser } from "@/components/projects/ProjectBrowser";
import { ProjectOverview } from "@/components/projects/ProjectOverview";
import { ProjectSidePanel } from "@/components/projects/ProjectSidePanel";
import { useDemo } from "@/context/DemoContext";
import { browse, DEFAULT_FILTERS, revealProject, type BrowseFilters } from "@/lib/project-browse";
import { publishedProjects } from "@/lib/project-helpers";

/**
 * Browse Projects. The selected project lives in the URL (?project=<id>), so a card click, a Featured Projects link,
 * the back button and a shared link all drive the same single source of truth. Nothing here navigates to another page.
 */
export function MarketDashboard() {
  const { state, ready } = useDemo();
  const projectParam = useSearchParams().get("project");
  const [filters, setFilters] = useState<BrowseFilters>(DEFAULT_FILTERS);
  const [revealed, setRevealed] = useState<string | null>(null);

  const allProjects = useMemo(() => publishedProjects(state), [state]);
  const requested = projectParam ? allProjects.find((p) => p.id === projectParam) ?? null : null;

  // Arriving with ?project=<id>: widen only the filters that hide it, once per requested project.
  if (ready && requested && revealed !== requested.id) {
    setRevealed(requested.id);
    const next = revealProject(allProjects, filters, requested.id);
    if (next !== filters) setFilters(next);
  }

  const results = useMemo(() => browse(allProjects, filters), [allProjects, filters]);
  // With no ?project the first result is the default; an unknown id is an error, never "the first project".
  const selected = !ready ? null : projectParam ? requested : results[0] ?? null;
  const notFound = ready && !!projectParam && !requested;

  const center = !ready ? (
    <div className="space-y-4" aria-busy="true" aria-label="Loading project"><Skeleton className="h-64 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-64 w-full" /></div>
  ) : notFound ? (
    <EmptyState title="Project not found" body={`No project with the reference “${projectParam}” exists in the current catalogue.`} action={<Link href="/projects" className="inline-flex min-h-11 items-center rounded-control bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">Browse all projects</Link>} />
  ) : selected ? (
    <ProjectOverview key={selected.id} project={selected} />
  ) : (
    <EmptyState title="No project to show" body="No projects match your filters. Clear a filter to see project details." />
  );

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)_360px]">
        <ProjectBrowser all={allProjects} results={results} filters={filters} onChange={setFilters} selectedId={selected?.id} loading={!ready}
          hrefFor={(p) => `/projects?project=${encodeURIComponent(p.id)}`}
          className="md:sticky md:top-24 md:max-h-[calc(100dvh-7rem)] md:self-start" />

        <div className="min-w-0 space-y-4">
          <div role="tablist" aria-label="View" className="inline-flex rounded-full border border-line bg-white p-1">
            <span role="tab" aria-selected="true" className="inline-flex min-h-9 items-center rounded-full bg-brand-600 px-4 text-sm font-semibold text-white">Project details</span>
          </div>
          {center}
        </div>

        <div className="min-w-0 md:col-span-2 xl:col-span-1 xl:sticky xl:top-24 xl:self-start">{ready && selected ? <ProjectSidePanel key={selected.id} project={selected} /> : null}</div>
      </div>
    </div>
  );
}
