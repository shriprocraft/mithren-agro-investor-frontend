"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bookmark, ChevronRight, FileText, MapPin, Share2, X } from "lucide-react";
import { DemoDocumentPreview, useToast } from "@/components/common/feedback";
import { SearchInput } from "@/components/common/DataTable";
import { Badge, Button, DefList, EmptyState, ErrorState, LoadingPage, SelectField, Section } from "@/components/common/ui";
import { MilestoneTimeline, ProjectImage } from "@/components/common/visuals";
import { InvestPanel } from "@/components/projects/InvestPanel";
import { ScenarioChart } from "@/components/projects/ScenarioChart";
import { ProjectAnalysisView } from "@/components/analysis/ProjectAnalysisView";
import { CATEGORIES, categoryLabel, COPY, durationLabel, STAGE_LABEL, TN_DISTRICTS } from "@/config/demo-config";
import { useDemo } from "@/context/DemoContext";
import { fundingProgress } from "@/lib/analysis-calculations";
import { cn } from "@/lib/cn";
import { formatDate, formatINR } from "@/lib/format";
import { toggleWatchlist } from "@/lib/mock-service";
import { publishedProjects, riskLabel, RISK_METHOD } from "@/lib/project-helpers";
import type { ProjectStage } from "@/types";

const DURATION_FILTERS: Record<string, { label: string; match: (months: number) => boolean }> = {
  upto3: { label: "Up to 3 months", match: (m) => m <= 3 },
  upto6: { label: "Up to 6 months", match: (m) => m <= 6 },
  "7to12": { label: "7–12 months", match: (m) => m >= 7 && m <= 12 },
  over12: { label: "Over 12 months", match: (m) => m > 12 },
};

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
  const [district, setDistrict] = useState("");
  const [risk, setRisk] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const [view, setView] = useState<DemoView>("default");
  const [pick, setPick] = useState<string | null>(params.get("project"));
  const [doc, setDoc] = useState<string | null>(null);

  const all = useMemo(() => (view === "empty" ? [] : publishedProjects(state)), [state, view]);
  const regions = useMemo(() => [...new Set(publishedProjects(state).map((p) => p.region))].sort(), [state]);
  const saved = session ? state.watchlist[session.userId] ?? [] : [];

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    const out = all.filter((p) =>
      (!t || [p.title, p.crop, p.location, categoryLabel(p.category)].join(" ").toLowerCase().includes(t)) &&
      (!category || p.category === category) && (!region || p.region === region) && (!stage || p.stage === stage) &&
      (!district || p.district === district) && (!duration || DURATION_FILTERS[duration]?.match(p.durationMonths)) && (!risk || riskLabel(p) === risk),
    );
    const cmp: Record<Sort, (a: (typeof out)[number], b: (typeof out)[number]) => number> = {
      featured: (a, b) => Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title),
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      funding: (a, b) => (fundingProgress(b.funding) ?? -1) - (fundingProgress(a.funding) ?? -1),
      duration: (a, b) => a.durationMonths - b.durationMonths,
    };
    return [...out].sort(cmp[sort]);
  }, [all, q, category, region, stage, district, duration, risk, sort]);

  const chips: { label: string; clear: () => void }[] = [
    q && { label: `Search: “${q}”`, clear: () => setQ("") },
    region && { label: region, clear: () => setRegion("") },
    stage && { label: STAGE_LABEL[stage as ProjectStage], clear: () => setStage("") },
    district && { label: district, clear: () => setDistrict("") },
    duration && { label: DURATION_FILTERS[duration]?.label ?? duration, clear: () => setDuration("") },
    risk && { label: `Risk label (demo): ${risk}`, clear: () => setRisk("") },
  ].filter(Boolean) as { label: string; clear: () => void }[];
  const reset = () => { setQ(""); setCategory(""); setRegion(""); setStage(""); setDistrict(""); setDuration(""); setRisk(""); };
  const moreFilters = [region, stage, district, duration, risk].filter(Boolean).length;

  const onToggle = (id: string) => {
    if (!session) { router.push(`/login?next=${encodeURIComponent("/projects")}`); return; }
    if (session.role !== "investor") { toast("Watchlists are available to investor accounts. Switch demo role to try it.", "warn"); return; }
    const r = run((s) => toggleWatchlist(s, session.userId, id));
    if (r.ok) toast(r.data ? "Saved to your watchlist." : "Removed from your watchlist.", "ok");
  };
  const copyLink = async (id: string) => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/projects/${id}`); toast("Project link copied.", "ok"); }
    catch { toast("Could not copy automatically. Copy the address from your browser bar.", "warn"); }
  };

  const selected = results.find((x) => x.id === pick) ?? results[0] ?? null;

  const list = (
    <ul className="divide-y divide-[#E8F1EA]" aria-label="Projects">
      {results.map((p) => {
        const prog = fundingProgress(p.funding);
        const active = selected?.id === p.id;
        return (
          <li key={p.id}>
            <button type="button" onClick={() => setPick(p.id)} aria-current={active ? "true" : undefined} className={cn("flex w-full gap-3 border-l-[3px] px-3 py-3 text-left transition-colors", active ? "border-[#2E7D32] bg-[#E3F4E6]" : "border-transparent hover:bg-[#F5FDF7]")}>
              <ProjectImage category={p.category} title={p.title} className="size-16 shrink-0 rounded-lg" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[#1F2D21]">{p.title}</span>
                <span className="mt-0.5 block truncate text-xs text-[#667085]">{p.district ? `${p.district}, ` : ""}{p.location}</span>
                <span className="mt-0.5 block truncate text-xs text-[#667085]">{p.crop} · {categoryLabel(p.category)}</span>
                <span className="tabular mt-0.5 block truncate text-xs text-[#667085]">From {formatINR(p.demoConfig.minAmount)} · {durationLabel(p.durationMonths)} · <span className={p.demoConfig.investable ? "font-semibold text-[#1B5E20]" : ""}>{p.demoConfig.investable ? "Open" : "Closed"}</span></span>
                <span className="mt-2 flex items-center gap-2">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8F1EA]"><span className="block h-full rounded-full bg-[#2E7D32]" style={{ width: `${prog ?? 0}%` }} /></span>
                  <span className="tabular shrink-0 text-[11px] text-[#667085]">{prog === null ? "No target" : `${prog}% funded`}</span>
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 self-center text-[#667085]" aria-hidden />
            </button>
          </li>
        );
      })}
    </ul>
  );

  const detail = selected && (() => {
    const p = selected;
    const prog = fundingProgress(p.funding);
    const remaining = p.funding ? Math.max(0, p.funding.target - p.funding.raised) : null;
    const isSaved = saved.includes(p.id);
    return (
      <>
        <section className="min-w-0 space-y-5" aria-label="Project details">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav aria-label="Breadcrumb" className="min-w-0 truncate text-xs text-[#667085]">
              <Link href="/projects" className="hover:underline">Explore</Link> <span aria-hidden>›</span> <Link href="/projects" className="hover:underline">Browse Projects</Link> <span aria-hidden>›</span> {categoryLabel(p.category)} <span aria-hidden>›</span> <span className="font-semibold text-[#1F2D21]">{p.title}</span>
            </nav>
            <div className="flex gap-2">
              <Button variant="ghost" className="min-h-9 text-xs" onClick={() => copyLink(p.id)}><Share2 className="size-4" aria-hidden /> Share</Button>
              <Button variant="ghost" className="min-h-9 text-xs" aria-pressed={isSaved} onClick={() => onToggle(p.id)}><Bookmark className={cn("size-4", isSaved && "fill-[#2E7D32] text-[#2E7D32]")} aria-hidden /> Watchlist</Button>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1F2D21] sm:text-3xl">{p.title}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#667085]">
              <span className="inline-flex items-center gap-1"><MapPin className="size-4" aria-hidden /> {p.district ? `${p.district}, ` : ""}{p.location}</span>
              <span aria-hidden className="text-[#E8F1EA]">|</span><span>{categoryLabel(p.category)}</span>
              <span aria-hidden className="text-[#E8F1EA]">|</span><span>{p.crop}</span>
              <span aria-hidden className="text-[#E8F1EA]">|</span><span>{STAGE_LABEL[p.stage]}</span>
            </p>
            <p className="mt-3 max-w-3xl text-sm text-[#1F2D21]">{p.summary}</p>
          </div>

          <div className="rounded-xl border border-[#E8F1EA] bg-white p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold text-[#1F2D21]">Projected project economics</h2>
              <span className="text-xs text-[#667085]">Illustrative scenarios · not historical performance</span>
            </div>
            <div className="mt-3"><ScenarioChart key={p.id} project={p} /></div>
          </div>

          {p.funding ? (
            <div className="rounded-xl border border-[#E8F1EA] bg-white p-5">
              <div className="flex items-baseline justify-between"><h2 className="text-sm font-bold text-[#1F2D21]">Funding progress</h2><span className="tabular text-sm font-bold text-[#1F2D21]">{prog}%</span></div>
              <div role="progressbar" aria-label={`Sample funding progress for ${p.title}`} aria-valuenow={prog ?? 0} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#E8F1EA]"><div className="h-full rounded-full bg-[#2E7D32]" style={{ width: `${prog ?? 0}%` }} /></div>
            </div>
          ) : <p className="rounded-xl border border-[#E8F1EA] bg-white p-5 text-sm text-[#667085]">This project does not use a funding target.</p>}

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              ["Funding target", p.funding ? formatINR(p.funding.target) : "—"],
              ["Amount funded", p.funding ? formatINR(p.funding.raised) : "—"],
              ["Funding progress", prog === null ? "—" : `${prog}%`],
              ["Remaining", remaining === null ? "—" : formatINR(remaining)],
              ["Duration", durationLabel(p.durationMonths)],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0 rounded-xl border border-[#E8F1EA] bg-white px-4 py-3"><dt className="truncate text-xs text-[#667085]">{k}</dt><dd className="tabular mt-1 truncate text-base font-bold text-[#1F2D21]">{v}</dd></div>
            ))}
          </dl>
          <p className="-mt-2 text-xs text-[#667085]">Funding figures are sample demo data. Minimum investment: {formatINR(p.demoConfig.minAmount)}.</p>

          <div className="space-y-3">
            <Section title="Project financials" defaultOpen={false}>
              {p.useOfFunds.length === 0 ? <p className="text-sm text-muted">Use of funds has not been provided.</p> : (
                <table className="mb-4 w-full text-sm"><caption className="sr-only">Planned use of funds</caption><tbody>{p.useOfFunds.map((u) => (<tr key={u.label} className="border-t border-line first:border-0"><th scope="row" className="py-2 text-left font-medium">{u.label}</th><td className="tabular py-2 text-right">{formatINR(u.amount)}</td></tr>))}</tbody></table>
              )}
              <ProjectAnalysisView project={p} />
            </Section>
            <Section title="Production & market assumptions" defaultOpen={false}>
              <p className="text-sm"><strong>Objective:</strong> {p.objective}</p>
              <div className="mt-4"><DefList rows={[["Production method", p.productionMethod], ["Season", p.season], ["Region", p.region], ["District", p.district || "—"]]} /></div>
              <div className="mt-4"><MilestoneTimeline items={p.milestones} /></div>
            </Section>
            <Section title="Risks & disclosures" defaultOpen={false} badge={<Badge tone={riskLabel(p) === "Higher" ? "warn" : "neutral"}>Risk label (demo): {riskLabel(p)}</Badge>}>
              {p.risks.length === 0 ? <p className="text-sm text-muted">No risks have been listed yet.</p> : (
                <ul className="space-y-3">{p.risks.map((r) => (<li key={r.id} className="rounded-control border border-line p-3 text-sm"><p className="font-semibold">{r.title} <Badge tone={r.severity === "high" ? "bad" : r.severity === "medium" ? "warn" : "neutral"} className="ml-1">{r.severity} severity</Badge></p><p className="mt-1 text-muted"><strong>Mitigation:</strong> {r.mitigation}</p></li>))}</ul>
              )}
              <p className="mt-3 text-xs text-muted">{RISK_METHOD}</p>
              <p className="mt-3 text-sm"><strong>What could go wrong:</strong> weather, disease or pests, price falls, delays, buyer non-payment and cost overruns can each reduce a project’s results. {COPY.noGuarantee}</p>
            </Section>
            <Section title="Project documents" defaultOpen={false}>
              {p.documentTitles.length === 0 ? <p className="text-sm text-muted">No documents uploaded.</p> : <ul className="space-y-2">{p.documentTitles.map((t) => (<li key={t}><button type="button" onClick={() => setDoc(t)} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-700 hover:underline"><FileText className="size-4" aria-hidden /> {t}</button></li>))}</ul>}
              {p.updates.length > 0 && <ul className="mt-4 space-y-3 border-t border-line pt-4">{p.updates.map((u) => (<li key={u.id} className="text-sm"><p className="font-semibold">{u.title} <span className="font-normal text-muted">· {formatDate(u.date)}</span></p><p className="text-muted">{u.body}</p></li>))}</ul>}
            </Section>
          </div>
          <p className="text-xs"><Link href={`/projects/${p.id}`} className="font-semibold text-[#2E7D32] hover:underline">Open full project page →</Link></p>
        </section>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-24 xl:self-start" aria-label="Investment panel">
          <div className="overflow-hidden rounded-xl border border-[#E8F1EA] bg-white"><ProjectImage category={p.category} title={p.title} className="h-36 w-full" /></div>
          <InvestPanel key={p.id} project={p} role={session?.role ?? null} isSaved={isSaved} onToggleSave={() => onToggle(p.id)} />
        </aside>
      </>
    );
  })();

  const wide = "lg:col-span-2 xl:col-span-2";
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col rounded-xl border border-[#E8F1EA] bg-white lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start">
          <div className="space-y-3 border-b border-[#E8F1EA] p-4">
            <div className="flex items-baseline justify-between"><div><h2 className="text-lg font-bold text-[#1F2D21]">Browse Projects</h2><p className="text-xs text-[#667085]">Discover agricultural investment opportunities.</p></div><span className="text-xs text-[#667085]" aria-live="polite">{results.length} project{results.length === 1 ? "" : "s"}</span></div>
            <SearchInput value={q} onChange={setQ} label="Search projects" placeholder="Search projects, crops, locations…" />
            <SelectField label="Sort by" value={sort} onChange={(e) => setSort(e.target.value as Sort)}><option value="featured">Featured</option><option value="newest">Newest</option><option value="funding">Funding progress</option><option value="duration">Shortest duration</option></SelectField>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Category">
              {[{ id: "", label: "All" }, ...CATEGORIES].map((c) => (
                <button key={c.id} type="button" aria-pressed={category === c.id} onClick={() => setCategory(c.id)} className={cn("rounded-full border px-3 py-1 text-xs font-semibold", category === c.id ? "border-[#2E7D32] bg-[#E3F4E6] text-[#1B5E20]" : "border-[#E8F1EA] text-[#667085] hover:bg-[#F5FDF7]")}>{c.label}</button>
              ))}
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer font-semibold text-[#667085]">More filters{moreFilters ? ` (${moreFilters})` : ""}</summary>
              <div className="mt-3 grid gap-3">
                <SelectField label="Region" value={region} onChange={(e) => setRegion(e.target.value)}><option value="">All regions</option>{regions.map((r) => <option key={r}>{r}</option>)}</SelectField>
                <SelectField label="Stage" value={stage} onChange={(e) => setStage(e.target.value)}><option value="">All stages</option>{Object.entries(STAGE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</SelectField>
                <SelectField label="District" value={district} onChange={(e) => setDistrict(e.target.value)}><option value="">All districts</option>{TN_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}</SelectField>
                <SelectField label="Duration" value={duration} onChange={(e) => setDuration(e.target.value)}><option value="">Any duration</option>{Object.entries(DURATION_FILTERS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</SelectField>
                <SelectField label="Risk label (demo method)" value={risk} onChange={(e) => setRisk(e.target.value)}><option value="">Any</option><option>Lower</option><option>Moderate</option><option>Higher</option></SelectField>
              </div>
            </details>
            {chips.length > 0 && (
              <ul className="flex flex-wrap items-center gap-1.5" aria-label="Active filters">
                {chips.map((c) => (<li key={c.label}><button type="button" onClick={c.clear} className="inline-flex min-h-8 items-center gap-1 rounded-full bg-[#E3F4E6] px-2.5 text-xs font-semibold text-[#1B5E20]">{c.label}<X className="size-3" aria-label="remove filter" /></button></li>))}
                <li><button type="button" onClick={reset} className="px-1 text-xs font-semibold text-[#667085] underline">Clear all</button></li>
              </ul>
            )}
            {view === "default" && selected && (
              <div className="lg:hidden">
                <SelectField label="Selected project" value={selected.id} onChange={(e) => setPick(e.target.value)}>{results.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</SelectField>
              </div>
            )}
          </div>
          <div className="hidden min-h-0 flex-1 overflow-y-auto lg:block">{view === "default" && results.length > 0 && list}</div>
        </div>

        {view === "loading" ? <div className={wide}><LoadingPage label="Loading projects…" /></div>
          : view === "error" ? <div className={wide}><ErrorState title="Could not load projects (simulated)" body="This is a demo error state. No request was made." onRetry={() => setView("default")} /></div>
          : all.length === 0 ? <div className={wide}><EmptyState title="The catalogue is empty" body="No projects have been published in this demo state." action={<Button variant="secondary" onClick={() => setView("default")}>Restore demo catalogue</Button>} /></div>
          : results.length === 0 ? <div className={wide}><EmptyState title="No projects match your filters" body="Try removing a filter or searching with different words." action={<Button onClick={reset}>Reset filters</Button>} /></div>
          : detail}
      </div>

      <details className="mt-8 rounded-card border border-dashed border-line p-4 text-sm">
        <summary className="cursor-pointer font-semibold text-muted">Demo only: preview other page states</summary>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["default", "loading", "error", "empty"] as DemoView[]).map((v) => (<Button key={v} variant={view === v ? "primary" : "secondary"} aria-pressed={view === v} onClick={() => setView(v)} className="capitalize">{v}</Button>))}
        </div>
      </details>
      <DemoDocumentPreview open={doc !== null} onClose={() => setDoc(null)} title={doc ?? ""} category="project document" />
    </div>
  );
}

export default function ProjectsPage() {
  return <Suspense fallback={<LoadingPage />}><Explorer /></Suspense>;
}
