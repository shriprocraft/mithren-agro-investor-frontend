"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List, X } from "lucide-react";
import { useToast } from "@/components/common/feedback";
import { SearchInput } from "@/components/common/DataTable";
import { Button, EmptyState, ErrorState, LoadingPage, SelectField } from "@/components/common/ui";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { CATEGORIES, categoryLabel, STAGE_LABEL } from "@/config/demo-config";
import { useDemo } from "@/context/DemoContext";
import { fundingProgress } from "@/lib/analysis-calculations";
import { toggleWatchlist } from "@/lib/mock-service";
import { durationBucket, publishedProjects, riskLabel } from "@/lib/project-helpers";
import type { CategoryId, ProjectStage } from "@/types";

type Sort = "featured" | "newest" | "funding" | "duration";
type DemoView = "default" | "loading" | "error" | "empty";

function Explorer() {
  const { state, session, run } = useDemo();
  const router = useRouter();
  const toast = useToast();
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>(params.get("category") ?? "");
  const [region, setRegion] = useState("");
  const [stage, setStage] = useState("");
  const [duration, setDuration] = useState("");
  const [risk, setRisk] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [view, setView] = useState<DemoView>("default");

  const all = useMemo(() => (view === "empty" ? [] : publishedProjects(state)), [state, view]);
  const regions = useMemo(() => [...new Set(publishedProjects(state).map((p) => p.region))].sort(), [state]);
  const saved = session ? state.watchlist[session.userId] ?? [] : [];

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    const out = all.filter((p) =>
      (!t || [p.title, p.crop, p.location, categoryLabel(p.category)].join(" ").toLowerCase().includes(t)) &&
      (!category || p.category === category) && (!region || p.region === region) && (!stage || p.stage === stage) &&
      (!duration || durationBucket(p.durationMonths) === duration) && (!risk || riskLabel(p) === risk),
    );
    const cmp: Record<Sort, (a: (typeof out)[number], b: (typeof out)[number]) => number> = {
      featured: (a, b) => Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title),
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      funding: (a, b) => (fundingProgress(b.funding) ?? -1) - (fundingProgress(a.funding) ?? -1),
      duration: (a, b) => a.durationMonths - b.durationMonths,
    };
    return [...out].sort(cmp[sort]);
  }, [all, q, category, region, stage, duration, risk, sort]);

  const chips: { label: string; clear: () => void }[] = [
    q && { label: `Search: “${q}”`, clear: () => setQ("") },
    category && { label: categoryLabel(category as CategoryId), clear: () => setCategory("") },
    region && { label: region, clear: () => setRegion("") },
    stage && { label: STAGE_LABEL[stage as ProjectStage], clear: () => setStage("") },
    duration && { label: { short: "Up to 6 months", medium: "7–12 months", long: "Over 12 months" }[duration] ?? duration, clear: () => setDuration("") },
    risk && { label: `Risk label (demo): ${risk}`, clear: () => setRisk("") },
  ].filter(Boolean) as { label: string; clear: () => void }[];
  const reset = () => { setQ(""); setCategory(""); setRegion(""); setStage(""); setDuration(""); setRisk(""); };

  const onToggle = (id: string) => {
    if (!session) { router.push(`/login?next=${encodeURIComponent("/projects")}`); return; }
    if (session.role !== "investor") { toast("Watchlists are available to investor accounts. Switch demo role to try it.", "warn"); return; }
    const r = run((s) => toggleWatchlist(s, session.userId, id));
    if (r.ok) toast(r.data ? "Saved to your watchlist." : "Removed from your watchlist.", "ok");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-brand-900">Browse projects</h1>
      <p className="mt-1 text-sm text-muted">Fictional agriculture projects for demonstration. Funding figures are sample data.</p>

      <div className="mt-6 grid gap-3 rounded-card border border-line bg-white p-4 shadow-card sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4"><SearchInput value={q} onChange={setQ} label="Search projects" placeholder="Search by name, crop, category or location" /></div>
        <SelectField label="Category" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</SelectField>
        <SelectField label="Region" value={region} onChange={(e) => setRegion(e.target.value)}><option value="">All regions</option>{regions.map((r) => <option key={r}>{r}</option>)}</SelectField>
        <SelectField label="Stage" value={stage} onChange={(e) => setStage(e.target.value)}><option value="">All stages</option>{Object.entries(STAGE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</SelectField>
        <SelectField label="Duration" value={duration} onChange={(e) => setDuration(e.target.value)}><option value="">Any duration</option><option value="short">Up to 6 months</option><option value="medium">7–12 months</option><option value="long">Over 12 months</option></SelectField>
        <SelectField label="Risk label (demo method)" value={risk} onChange={(e) => setRisk(e.target.value)}><option value="">Any</option><option>Lower</option><option>Moderate</option><option>Higher</option></SelectField>
        <SelectField label="Sort by" value={sort} onChange={(e) => setSort(e.target.value as Sort)}><option value="featured">Featured</option><option value="newest">Newest</option><option value="funding">Funding progress</option><option value="duration">Shortest duration</option></SelectField>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold" aria-live="polite">{view === "default" || view === "empty" ? `${results.length} project${results.length === 1 ? "" : "s"}` : ""}</p>
        <div className="flex gap-1" role="group" aria-label="Layout">
          <Button variant={layout === "grid" ? "primary" : "secondary"} aria-pressed={layout === "grid"} aria-label="Grid layout" onClick={() => setLayout("grid")}><LayoutGrid className="size-4" aria-hidden /></Button>
          <Button variant={layout === "list" ? "primary" : "secondary"} aria-pressed={layout === "list"} aria-label="List layout" onClick={() => setLayout("list")}><List className="size-4" aria-hidden /></Button>
        </div>
      </div>
      {chips.length > 0 && (
        <ul className="mt-3 flex flex-wrap items-center gap-2" aria-label="Active filters">
          {chips.map((c) => (<li key={c.label}><button type="button" onClick={c.clear} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-brand-100 px-3 text-xs font-semibold text-brand-800">{c.label}<X className="size-3.5" aria-label="remove filter" /></button></li>))}
          <li><Button variant="ghost" className="min-h-9" onClick={reset}>Clear filters</Button></li>
        </ul>
      )}

      <div className="mt-5">
        {view === "loading" ? <LoadingPage label="Loading projects…" />
          : view === "error" ? <ErrorState title="Could not load projects (simulated)" body="This is a demo error state. No request was made." onRetry={() => setView("default")} />
          : all.length === 0 ? <EmptyState title="The catalogue is empty" body="No projects have been published in this demo state." action={<Button variant="secondary" onClick={() => setView("default")}>Restore demo catalogue</Button>} />
          : results.length === 0 ? <EmptyState title="No projects match your filters" body="Try removing a filter or searching with different words." action={<Button onClick={reset}>Reset filters</Button>} />
          : <div className={layout === "grid" ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>{results.map((p) => <ProjectCard key={p.id} project={p} layout={layout} saved={saved.includes(p.id)} onToggleSave={() => onToggle(p.id)} />)}</div>}
      </div>

      <details className="mt-10 rounded-card border border-dashed border-line p-4 text-sm">
        <summary className="cursor-pointer font-semibold text-muted">Demo only: preview other page states</summary>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["default", "loading", "error", "empty"] as DemoView[]).map((v) => (<Button key={v} variant={view === v ? "primary" : "secondary"} aria-pressed={view === v} onClick={() => setView(v)} className="capitalize">{v}</Button>))}
        </div>
      </details>
    </div>
  );
}

export default function ProjectsPage() {
  return <Suspense fallback={<LoadingPage />}><Explorer /></Suspense>;
}
