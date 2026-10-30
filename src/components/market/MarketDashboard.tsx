"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EmptyState, Skeleton } from "@/components/common/ui";
import { SkeletonRegion } from "@/components/common/skeletons";
import { ProjectBrowser } from "@/components/projects/ProjectBrowser";
import { ProjectOverview } from "@/components/projects/ProjectOverview";
import { ProjectSidePanel } from "@/components/projects/ProjectSidePanel";
import { useDemo } from "@/context/DemoContext";
import { cn } from "@/lib/cn";
import { browse, DEFAULT_FILTERS, revealProject, type BrowseFilters } from "@/lib/project-browse";
import { publishedProjects } from "@/lib/project-helpers";

/**
 * Browse Projects. The selected project lives in the URL (?project=<id>), so a card click, a Featured Projects link,
 * the back button and a shared link all drive the same single source of truth. Nothing here navigates to another page.
 */
/**
 * Desktop (xl, three columns side by side): every column is an independent scroller sized to the viewport below the
 * sticky header, so scrolling one column never moves its neighbours. Scroll chaining is deliberately left on: once a
 * column reaches its end, further scrolling passes to the page, so the user is never trapped and can always reach the
 * page bottom (and back to the top). Below xl the columns stack with no height limit and the whole page scrolls.
 */
const COLUMN = "xl:sticky xl:top-[calc(var(--public-header-h,7.5rem)+1.5rem)] xl:max-h-[calc(100dvh-var(--public-header-h,7.5rem)-3rem)] xl:overflow-y-auto";

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
    <SkeletonRegion label="Loading project…" className="space-y-4"><Skeleton className="h-64 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-64 w-full" /></SkeletonRegion>
  ) : notFound ? (
    <EmptyState title="Project not found" body={`No project with the reference “${projectParam}” exists in the current catalogue.`} action={<Link href="/projects" className="inline-flex min-h-11 items-center rounded-control bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">Browse all projects</Link>} />
  ) : selected ? (
    <ProjectOverview key={selected.id} project={selected} />
  ) : (
    <EmptyState title="No project to show" body="No projects match your filters. Clear a filter to see project details." />
  );

  // Each column is its own scroller on xl, so a newly selected project starts at the top of the details and invest columns.
  const centerRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    for (const el of [centerRef.current, sideRef.current]) if (el && el.scrollHeight > el.clientHeight) el.scrollTop = 0;
  }, [selected?.id]);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)_360px] xl:items-start">
        <ProjectBrowser all={allProjects} results={results} filters={filters} onChange={setFilters} selectedId={selected?.id} loading={!ready}
          hrefFor={(p) => `/projects?project=${encodeURIComponent(p.id)}`}
          className={COLUMN} />

        <div ref={centerRef} className={cn("min-w-0 space-y-4", COLUMN)}>
          <div role="tablist" aria-label="View" className="inline-flex rounded-full border border-line bg-white p-1">
            <span role="tab" aria-selected="true" className="inline-flex min-h-9 items-center rounded-full bg-brand-600 px-4 text-sm font-semibold text-white">Project details</span>
          </div>
          {center}
        </div>

        <div ref={sideRef} className={cn("min-w-0 md:col-span-2 xl:col-span-1", COLUMN)}>{ready && selected ? <ProjectSidePanel key={selected.id} project={selected} /> : null}</div>
      </div>
    </div>
  );
}
