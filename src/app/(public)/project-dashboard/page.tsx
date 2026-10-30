"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, FolderKanban, Layers, Wallet } from "lucide-react";
import { Badge, Button, Callout, EmptyState, ProgressBar, SelectField, type Tone } from "@/components/common/ui";
import { ProjectImage } from "@/components/common/visuals";
import { EnquiryModal, type EnquiryPrefill } from "@/components/plans/EnquiryModal";
import { MarketSkeleton } from "@/components/common/skeletons";
import { HBarChart, MultiLineChart, SERIES_COLORS } from "@/components/projects/dashboard-charts";
import { MockStatusBadge } from "@/components/projects/MockStatusBadge";
import { ProjectBrowser } from "@/components/projects/ProjectBrowser";
import { CATEGORIES, categoryLabel } from "@/config/demo-config";
import { useDemo } from "@/context/DemoContext";
import {
  activitiesFor, dashboardSummary, ILLUSTRATIVE_DATA_ENABLED, MOCK_LABEL, mockFor, MONTHLY_ACTIVITY, MONTHS, type ActivityStatus,
} from "@/data/project-dashboard-mock";
import { formatDate, formatINR } from "@/lib/format";
import { browse, DEFAULT_FILTERS, type BrowseFilters } from "@/lib/project-browse";
import { publishedProjects } from "@/lib/project-helpers";
import type { CategoryId } from "@/types";

const ACTIVITY_TONE: Record<ActivityStatus, Tone> = { Completed: "ok", "In Progress": "warn", Scheduled: "neutral" };
const catColor = (id: CategoryId) => SERIES_COLORS[CATEGORIES.findIndex((c) => c.id === id) % SERIES_COLORS.length];

function Dashboard() {
  const { state, ready } = useDemo();
  const router = useRouter();
  const params = useSearchParams();
  const [filters, setFilters] = useState<BrowseFilters>(() => ({ ...DEFAULT_FILTERS, category: CATEGORIES.find((c) => c.id === params.get("category"))?.id ?? "" }));
  const [tableCat, setTableCat] = useState<CategoryId | "">("");
  const [prefill, setPrefill] = useState<EnquiryPrefill | null>(null);
  const category = filters.category;

  // Old deep links (/projects?project=p-1) now go to the real detail route.
  const legacy = params.get("project");
  useEffect(() => { if (legacy) router.replace(`/projects/${encodeURIComponent(legacy)}`); }, [legacy, router]);

  const all = useMemo(() => publishedProjects(state), [state]);
  const summary = useMemo(() => dashboardSummary(all), [all]);
  const shown = useMemo(() => browse(all, filters), [all, filters]);

  const lineSeries = useMemo(
    () => CATEGORIES.filter((c) => !category || c.id === category).map((c) => ({ key: c.id, label: c.label, color: catColor(c.id), values: MONTHLY_ACTIVITY[c.id] })),
    [category],
  );
  const categoryRows = CATEGORIES.map((c) => ({ id: c.id, label: c.label, value: all.filter((p) => p.category === c.id).length, color: catColor(c.id) }));
  const progressRows = shown.flatMap((p) => { const m = mockFor(p.id); return m ? [{ id: p.id, label: p.title, value: m.progress, detail: m.status, color: catColor(p.category) }] : []; });
  const activities = useMemo(() => activitiesFor().filter((a) => {
    const p = all.find((x) => x.id === a.projectId);
    return !!p && (!tableCat || p.category === tableCat);
  }).sort((a, b) => b.date.localeCompare(a.date)), [all, tableCat]);

  const cards = [
    { icon: FolderKanban, label: "Total Projects", value: String(summary.total), note: "In the catalogue" },
    { icon: Activity, label: "Active Projects", value: summary.active === null ? "—" : String(summary.active), note: "Illustrative status" },
    { icon: Layers, label: "Project Categories", value: String(summary.categories), note: "Agricultural categories" },
    { icon: Wallet, label: "Total Contributions", value: summary.contributions === null ? "—" : formatINR(summary.contributions), note: "Illustrative mock data" },
  ];

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-brand-900">Agricultural Project Dashboard</h1>
        <p className="mt-2 max-w-3xl text-muted">Explore project activities, operational metrics, and illustrative performance trends across agricultural investments.</p>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <ProjectBrowser all={all} results={shown} filters={filters} onChange={setFilters} loading={!ready} className="lg:sticky lg:top-[7.5rem] lg:h-[calc(100dvh-9rem)] lg:overflow-y-auto lg:overscroll-contain lg:self-start" />

        <div className="min-w-0 space-y-8">
          {summary.illustrative && <Callout tone="info" title="Illustrative mock data">{MOCK_LABEL} Statuses, progress, budgets, contributions, activities and trends below are sample values for demonstration only.</Callout>}

          <section aria-label="Summary" className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
            {cards.map((c) => (
              <div key={c.label} className="rounded-card border border-line bg-white p-5 shadow-card">
                <div className="flex items-center gap-2 text-sm font-semibold text-brand-800"><c.icon className="size-5" aria-hidden />{c.label}</div>
                <p className="tabular mt-2 text-3xl font-bold text-brand-900">{c.value}</p>
                <p className="mt-1 text-xs text-muted">{c.note}</p>
              </div>
            ))}
          </section>

          <p role="status" aria-live="polite" className="text-sm text-muted">Showing {shown.length} of {all.length} projects matching your filters</p>

          {shown.length === 0 ? (
            <EmptyState title="No projects match" body="Adjust the search or filters in the sidebar." action={<Button variant="secondary" onClick={() => setFilters({ ...DEFAULT_FILTERS, sort: filters.sort })}>Clear filters</Button>} />
          ) : (
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
              {shown.map((p) => {
                const m = mockFor(p.id);
                return (
                  <li key={p.id} className="flex">
                    <article className="group flex w-full flex-col overflow-hidden rounded-card border border-line bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-hover">
                      <ProjectImage category={p.category} title={p.title} src={p.image} className="aspect-[16/9] w-full" />
                      <div className="flex flex-1 flex-col gap-3 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="ok">{categoryLabel(p.category)}</Badge>
                          {m && <MockStatusBadge status={m.status} />}
                          <span className="ml-auto text-xs text-muted">{p.id.toUpperCase()}</span>
                        </div>
                        <h2 className="text-lg font-bold leading-snug text-brand-900">{p.title}</h2>
                        <p className="line-clamp-2 text-sm text-muted">{p.summary}</p>
                        {m ? (
                          <div>
                            <div className="mb-1 flex justify-between text-xs"><span>Progress (illustrative)</span><span className="tabular font-semibold">{m.progress}%</span></div>
                            <ProgressBar value={m.progress} label={`Illustrative progress for ${p.title}`} />
                            <p className="mt-2 text-xs text-muted">{formatDate(m.startDate)} → {formatDate(m.estimatedCompletionDate)}</p>
                          </div>
                        ) : <p className="text-xs text-muted">Progress and dates: not provided.</p>}
                        <div className="mt-auto flex flex-wrap gap-2 pt-2">
                          <Link href={`/projects/${p.id}`} aria-label={`View project: ${p.title}`} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-control border border-line bg-white px-4 text-sm font-semibold text-brand-800 hover:bg-brand-50">View Project</Link>
                          <Button className="flex-1" onClick={() => setPrefill({ projectId: p.id, heading: p.title })} aria-label={`Enquire about ${p.title}`}>Enquire</Button>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}

          <section aria-label="Charts" className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="min-w-0 rounded-card border border-line bg-white p-5 shadow-card xl:col-span-2">
              <h2 className="text-lg font-bold text-brand-900">Monthly Project Activity</h2>
              <p className="mb-3 text-xs text-muted">Illustrative activity indices (May–Oct), not verified production or revenue. {category ? `Showing ${categoryLabel(category)}.` : "Showing all categories."}</p>
              <MultiLineChart labels={MONTHS} series={ILLUSTRATIVE_DATA_ENABLED ? lineSeries : []} title="Monthly Project Activity" description="Illustrative monthly activity index by agricultural category." />
            </div>
            <div className="min-w-0 rounded-card border border-line bg-white p-5 shadow-card">
              <h2 className="text-lg font-bold text-brand-900">Projects by Agricultural Category</h2>
              <p className="mb-3 text-xs text-muted">Counts come from the project list.</p>
              <HBarChart rows={categoryRows} max={Math.max(2, ...categoryRows.map((r) => r.value))} title="Projects by Agricultural Category" description="Number of projects in each category." />
            </div>
            <div className="min-w-0 rounded-card border border-line bg-white p-5 shadow-card">
              <h2 className="text-lg font-bold text-brand-900">Project Progress Overview</h2>
              <p className="mb-3 text-xs text-muted">Illustrative progress values on a 0–100% scale, not verified performance. Follows the sidebar filters.</p>
              <HBarChart rows={progressRows} max={100} unit="%" title="Project Progress Overview" description="Illustrative progress percentage per project." />
            </div>
          </section>

          <section aria-labelledby="activities-heading" className="rounded-card border border-line bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="activities-heading" className="text-lg font-bold text-brand-900">Recent Project Activities</h2>
                <p className="text-xs text-muted">Illustrative sample activities, not verified operational history.</p>
              </div>
              <div className="w-full sm:w-60"><SelectField label="Category" value={tableCat} onChange={(e) => setTableCat(e.target.value as CategoryId | "")}><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</SelectField></div>
            </div>
            {activities.length === 0 ? <p className="py-8 text-center text-sm text-muted">No activities match this category.</p> : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead><tr className="border-b border-line text-xs uppercase tracking-wide text-muted"><th className="py-2 pr-3">Date</th><th className="pr-3">Project</th><th className="pr-3">Category</th><th className="pr-3">Activity</th><th>Status</th></tr></thead>
                  <tbody>
                    {activities.map((a) => { const p = all.find((x) => x.id === a.projectId)!; return (
                      <tr key={a.id} className="border-b border-line last:border-0">
                        <td className="whitespace-nowrap py-2 pr-3">{formatDate(a.date)}</td>
                        <td className="pr-3 font-medium"><Link href={`/projects/${p.id}`} className="hover:underline">{p.title}</Link></td>
                        <td className="pr-3">{categoryLabel(p.category)}</td><td className="pr-3">{a.activity}</td>
                        <td><Badge tone={ACTIVITY_TONE[a.status]}>{a.status}</Badge></td>
                      </tr>
                    ); })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
      <EnquiryModal open={prefill !== null} onClose={() => setPrefill(null)} prefill={prefill ?? {}} />
    </div>
  );
}

export default function ProjectDashboardPage() {
  return <Suspense fallback={<MarketSkeleton />}><Dashboard /></Suspense>;
}
