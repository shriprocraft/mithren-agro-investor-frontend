"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Button, EmptyState } from "@/components/common/ui";
import { ProjectImage } from "@/components/common/visuals";
import { EnquiryModal, type EnquiryPrefill } from "@/components/plans/EnquiryModal";
import { ProjectCardGridSkeleton } from "@/components/common/skeletons";
import { CATEGORIES, categoryLabel } from "@/config/demo-config";
import { useDemo } from "@/context/DemoContext";
import { PROJECT_IMAGES } from "@/data/project-images";
import { cn } from "@/lib/cn";
import { publishedProjects } from "@/lib/project-helpers";
import type { CategoryId } from "@/types";

export function ProjectCatalogue() {
  const { state, ready } = useDemo();
  const [category, setCategory] = useState<CategoryId | "">("");
  const [prefill, setPrefill] = useState<EnquiryPrefill | null>(null);
  const all = useMemo(() => publishedProjects(state), [state]);
  const shown = useMemo(() => (category ? all.filter((p) => p.category === category) : all), [all, category]);
  const countOf = (id: CategoryId) => all.filter((p) => p.category === id).length;

  return (
    <section aria-labelledby="catalogue-heading" className="space-y-5">
      <div>
        <h2 id="catalogue-heading" className="text-2xl font-bold text-brand-900">Agricultural projects</h2>
        <p className="mt-1 text-sm text-muted" role="status" aria-live="polite">
          {shown.length} Agricultural Project{shown.length === 1 ? "" : "s"}{category ? ` in ${categoryLabel(category)}` : ""}
        </p>
      </div>

      <div role="group" aria-label="Filter projects by category" className="flex flex-wrap gap-2">
        {([{ id: "", label: "All Projects" }, ...CATEGORIES] as { id: CategoryId | ""; label: string }[]).map((c) => {
          const active = category === c.id;
          const n = c.id ? countOf(c.id) : all.length;
          return (
            <button key={c.id || "all"} type="button" aria-pressed={active} onClick={() => setCategory(c.id)}
              className={cn("inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                active ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white text-brand-800 hover:bg-brand-50")}>
              {c.label}<span className={cn("tabular rounded-full px-2 text-xs", active ? "bg-white/20" : "bg-brand-100 text-brand-800")}>{n}</span>
            </button>
          );
        })}
      </div>

      {!ready ? <ProjectCardGridSkeleton /> : shown.length === 0 ? <EmptyState title="No projects in this category" /> : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => (
            <li key={p.id} className="flex">
              <article className="group flex w-full flex-col overflow-hidden rounded-card border border-line bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-hover">
                <ProjectImage category={p.category} title={p.title} src={p.image ?? PROJECT_IMAGES[p.id]} className="aspect-[16/9] w-full" />
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <Badge tone="ok" className="self-start">{categoryLabel(p.category)}</Badge>
                  <h3 className="text-lg font-bold leading-snug text-brand-900">{p.title}</h3>
                  <p className="line-clamp-3 text-sm text-muted">{p.summary}</p>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">Key activities</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink">
                      {(p.activities ?? []).slice(0, 3).map((a) => <li key={a}>{a}</li>)}
                    </ul>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    <Link href={`/projects?project=${encodeURIComponent(p.id)}`} aria-label={`View project: ${p.title}`} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-control border border-line bg-white px-4 text-sm font-semibold text-brand-800 hover:bg-brand-50">View Project</Link>
                    <Button className="flex-1" onClick={() => setPrefill({ projectId: p.id, heading: p.title })} aria-label={`Enquire now about ${p.title}`}>Enquire Now</Button>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
      {ready && shown.length > 0 && <p className="text-xs text-muted">Representative photos from Wikimedia Commons contributors (CC licences), not images of the listed demo projects.</p>}
      <EnquiryModal open={prefill !== null} onClose={() => setPrefill(null)} prefill={prefill ?? {}} />
    </section>
  );
}
