"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search, X } from "lucide-react";
import { Button, EmptyState, ErrorState, Skeleton } from "@/components/common/ui";
import { ProjectImage } from "@/components/common/visuals";
import { CATEGORIES, categoryLabel } from "@/config/demo-config";
import { cn } from "@/lib/cn";
import { formatINR } from "@/lib/format";
import {
  activeExtraFilters, clearMoreFilters, DEFAULT_FILTERS, DISTRICT_OPTIONS, DURATION_OPTIONS, durationText, progressOf, RISK_OPTIONS, SORT_OPTIONS, STAGE_OPTIONS, statusOf,
  type BrowseFilters, type RiskFilter, type SortKey,
} from "@/lib/project-browse";
import { ALL_REGIONS_LABEL, REGIONS, type RegionFilter } from "@/lib/regions";
import type { ProjectStage } from "@/types";
import type { CategoryId, Project } from "@/types";

const sel = "min-h-11 w-full rounded-control border border-line bg-white px-3 text-sm text-ink focus:border-brand-600 focus-visible:outline-2 focus-visible:outline-brand-600";

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-ink">{label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className={cn(sel, "mt-1 font-normal")}>{children}</select>
    </label>
  );
}

export function ProjectBrowser({ all, results, filters, onChange, selectedId, loading, error, className, hrefFor, onSelect }: {
  all: Project[]; results: Project[]; filters: BrowseFilters; onChange: (f: BrowseFilters) => void; selectedId?: string; loading?: boolean; error?: string | null; className?: string;
  /** Where a card links to. Defaults to the project page; Browse Projects passes a same-page link so details update in place. */
  hrefFor?: (p: Project) => string;
  onSelect?: (p: Project) => void;
}) {
  const [more, setMore] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Bring the open project into view inside the list (without scrolling the page).
  useEffect(() => {
    const box = asideRef.current;
    const cur = listRef.current?.querySelector<HTMLElement>("[aria-current=page]");
    if (!box || !cur) return;
    const b = box.getBoundingClientRect(), c = cur.getBoundingClientRect();
    if (c.top >= b.top && c.top < b.bottom - 24) return; // already starts in view: keep the filters at the top
    box.scrollTop = Math.max(0, box.scrollTop + c.top - b.top - box.clientHeight / 2 + c.height / 2);
  }, [selectedId, loading]);
  const set = <K extends keyof BrowseFilters>(k: K, v: BrowseFilters[K]) => onChange({ ...filters, [k]: v });
  const extra = activeExtraFilters(filters);
  const clearExtra = () => onChange(clearMoreFilters(filters));

  return (
    <aside ref={asideRef} aria-label="Browse projects" className={cn("flex min-w-0 flex-col overflow-x-hidden rounded-card border border-line bg-white shadow-card", className)}>
      <div className="shrink-0 space-y-2.5 border-b border-line p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><h2 className="text-lg font-bold text-ink">Browse Projects</h2><p className="text-sm text-muted">Discover agricultural investment opportunities.</p></div>
          <span className="shrink-0 text-right text-sm font-semibold text-muted" aria-live="polite">{loading ? "…" : `${results.length} project${results.length === 1 ? "" : "s"}`}</span>
        </div>

        <label className="relative block"><span className="sr-only">Search projects, crops, locations</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input type="text" value={filters.q} onChange={(e) => set("q", e.target.value)} placeholder="Search projects, crops, locations..." className="min-h-11 w-full rounded-control border border-line bg-white pl-9 pr-9 text-sm focus-visible:outline-2 focus-visible:outline-brand-600" />
          {filters.q && <button type="button" aria-label="Clear search" onClick={() => set("q", "")} className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded text-muted hover:text-ink"><X className="size-4" aria-hidden /></button>}
        </label>

        <label className="flex items-center gap-3 text-sm font-semibold text-ink"><span className="shrink-0">Sort by</span>
          <select value={filters.sort} onChange={(e) => set("sort", e.target.value as SortKey)} className={cn(sel, "min-w-0 flex-1 font-normal")}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>

        <div role="group" aria-label="Category" className="flex flex-wrap gap-1.5">
          {([{ id: "", label: "All" }, ...CATEGORIES] as { id: CategoryId | ""; label: string }[]).map((c) => (
            <button key={c.id || "all"} type="button" aria-pressed={filters.category === c.id} onClick={() => set("category", c.id)}
              className={cn("min-h-8 rounded-full border px-3 text-[13px] font-semibold focus-visible:outline-2 focus-visible:outline-brand-600", filters.category === c.id ? "border-brand-600 bg-brand-600 text-white" : "border-brand-600/50 bg-white text-brand-800 hover:bg-brand-50")}>{c.label}</button>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
          <button type="button" aria-expanded={more} aria-controls="more-filters" onClick={() => setMore(!more)} className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink">
            <ChevronRight className={cn("size-3.5 transition-transform", more && "rotate-90")} aria-hidden />More filters{extra > 0 ? ` (${extra})` : ""}
          </button>
          {!loading && !error && <p className="text-sm text-muted" role="status">Showing {results.length} of {all.length}</p>}
          </div>
          <div className={cn("grid transition-[grid-template-rows,opacity] duration-200 ease-out", more ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
            <div id="more-filters" inert={!more} className="min-h-0 overflow-hidden">
              <div className="grid gap-3 p-0.5">
                <FilterSelect label="Region" value={filters.region} onChange={(v) => set("region", v as RegionFilter)}>
                  <option value="">{ALL_REGIONS_LABEL}</option>{REGIONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </FilterSelect>
                <FilterSelect label="Stage" value={filters.stage} onChange={(v) => set("stage", v as ProjectStage | "")}>
                  <option value="">All stages</option>{STAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </FilterSelect>
                <FilterSelect label="District" value={filters.district} onChange={(v) => set("district", v)}>
                  <option value="">All districts</option>{DISTRICT_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </FilterSelect>
                <FilterSelect label="Duration" value={filters.duration} onChange={(v) => set("duration", v)}>
                  <option value="">Any duration</option>{DURATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </FilterSelect>
                <FilterSelect label="Risk label (demo method)" value={filters.risk} onChange={(v) => set("risk", v as RiskFilter)}>
                  <option value="">Any</option>{RISK_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </FilterSelect>
                <button type="button" onClick={clearExtra} className="min-h-10 justify-self-start rounded-control border border-line px-3 text-sm font-semibold text-brand-800 hover:bg-brand-50">Clear filters</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={listRef} className="shrink-0" aria-label="Project list">
        {error ? <div className="p-4"><ErrorState title="Could not load projects" body={error} /></div>
          : loading ? <div className="space-y-3 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          : all.length === 0 ? <div className="p-4"><EmptyState title="No projects available" body="No projects have been published yet." /></div>
          : results.length === 0 ? <div className="p-4"><EmptyState title="No projects match your filters." body="Try changing your search or clearing one or more filters." action={<Button variant="secondary" onClick={() => onChange({ ...DEFAULT_FILTERS, sort: filters.sort })}>Clear filters</Button>} /></div>
          : (
            <ul className="divide-y divide-line">
              {results.map((p) => {
                const pct = progressOf(p);
                const status = statusOf(p);
                const on = p.id === selectedId;
                return (
                  <li key={p.id}>
                    <Link href={hrefFor ? hrefFor(p) : `/projects/${p.id}`} scroll={false} onClick={() => onSelect?.(p)} aria-current={on ? "page" : undefined}
                      className={cn("flex gap-3 border-l-[3px] px-4 py-3.5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600", on ? "border-brand-600 bg-[#E3F4E6]" : "border-transparent hover:bg-brand-50")}>
                      <ProjectImage category={p.category} title={p.title} src={p.image} className="size-20 shrink-0 rounded-lg" />
                      <span className="min-w-0 flex-1 space-y-0.5 text-[13px] text-muted">
                        <span className="block truncate text-base font-semibold text-ink">{p.title}</span>
                        <span className="block truncate">{[p.district, p.location].filter(Boolean).join(", ")}</span>
                        <span className="block truncate">{p.crop} · {categoryLabel(p.category)}</span>
                        <span className="tabular block truncate">From {formatINR(p.demoConfig.minAmount)} · {durationText(p.durationMonths)} · <span className={cn("font-semibold", status === "Open" || status === "Funding in Progress" ? "text-brand-700" : "text-ink")}>{status}</span></span>
                        {pct !== null
                          ? <span className="mt-1.5 flex items-center gap-2"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-100"><span className="block h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} /></span><span className="tabular shrink-0 text-[11px]">{pct}% funded</span></span>
                          : <span className="block pt-0.5 text-[11px]">No funding target set</span>}
                      </span>
                      <ChevronRight className="size-4 shrink-0 self-center text-muted" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
      </div>
    </aside>
  );
}
