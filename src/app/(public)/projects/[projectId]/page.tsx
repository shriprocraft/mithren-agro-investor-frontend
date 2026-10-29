"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, FileText, Heart } from "lucide-react";
import { DemoDocumentPreview, useToast } from "@/components/common/feedback";
import { Badge, Breadcrumbs, Button, Callout, Card, DefList, EmptyState, LinkButton, LoadingPage, ProgressBar, Section } from "@/components/common/ui";
import { ProjectBrowser } from "@/components/projects/ProjectBrowser";
import { browse, DEFAULT_FILTERS, type BrowseFilters } from "@/lib/project-browse";
import { publishedProjects } from "@/lib/project-helpers";
import { EnquiryModal } from "@/components/plans/EnquiryModal";
import { HBarChart, MultiLineChart, SERIES_COLORS } from "@/components/projects/dashboard-charts";
import { MockStatusBadge } from "@/components/projects/MockStatusBadge";
import { activitiesFor, MOCK_LABEL, mockFor, MONTHS, OPERATIONAL_REQUIREMENTS } from "@/data/project-dashboard-mock";
import { MilestoneTimeline, ProjectImage } from "@/components/common/visuals";
import { ProjectAnalysisView } from "@/components/analysis/ProjectAnalysisView";
import { CATEGORIES, categoryLabel, COPY, durationLabel, STAGE_LABEL } from "@/config/demo-config";
import { useDemo } from "@/context/DemoContext";
import { fundingProgress } from "@/lib/analysis-calculations";
import { formatDate, formatINR } from "@/lib/format";
import { toggleWatchlist } from "@/lib/mock-service";
import { isPublished, projectById, riskLabel, RISK_METHOD } from "@/lib/project-helpers";

/** Left-hand project list on the detail page; the open project is highlighted. */
function DetailSidebar({ selectedId }: { selectedId: string }) {
  const { state, ready } = useDemo();
  const [filters, setFilters] = useState<BrowseFilters>(DEFAULT_FILTERS);
  const all = publishedProjects(state);
  return <ProjectBrowser all={all} results={browse(all, filters)} filters={filters} onChange={setFilters} selectedId={selectedId} loading={!ready} className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)]" />;
}

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { state, session, ready, run } = useDemo();
  const router = useRouter();
  const toast = useToast();
  const [doc, setDoc] = useState<string | null>(null);
  const [enquire, setEnquire] = useState(false);

  if (!ready) return <LoadingPage />;
  const p = projectById(state, projectId);
  const canPreview = !!p && !!session && (session.role === "admin" || session.userId === p.ownerId);
  if (!p || (!isPublished(p) && !canPreview)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState title="Project not found" body="This project does not exist or is not published in the demo catalogue." action={<LinkButton href="/project-dashboard">Back to Projects</LinkButton>} />
      </div>
    );
  }

  const saved = !!session && (state.watchlist[session.userId] ?? []).includes(p.id);
  const prog = fundingProgress(p.funding);
  const remaining = p.funding ? Math.max(0, p.funding.target - p.funding.raised) : null;
  const isInvestor = session?.role === "investor";
  const mock = mockFor(p.id);
  const history = [...activitiesFor(p.id)].sort((a, b) => b.date.localeCompare(a.date));
  const color = SERIES_COLORS[Math.max(0, CATEGORIES.findIndex((c) => c.id === p.category)) % SERIES_COLORS.length];

  const toggleSave = () => {
    if (!session) return router.push(`/login?next=${encodeURIComponent(`/projects/${p.id}`)}`);
    if (!isInvestor) return toast("Watchlists are available to investor accounts.", "warn");
    const r = run((s) => toggleWatchlist(s, session.userId, p.id));
    if (r.ok) toast(r.data ? "Saved to your watchlist." : "Removed from your watchlist.", "ok");
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); toast("Project link copied.", "ok"); }
    catch { toast("Could not copy automatically. Copy the address from your browser bar.", "warn"); }
  };

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start lg:gap-6">
      <div className="hidden lg:block"><DetailSidebar selectedId={p.id} /></div>
      <div className="min-w-0">
      <Breadcrumbs items={[{ label: "Projects", href: "/project-dashboard" }, { label: p.title }]} />
      <Link href="/project-dashboard" className="mb-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 hover:underline">← Back to Projects</Link>
      {!isPublished(p) && <Callout tone="info" title="Unpublished preview" className="mb-4">You are viewing this project as its owner or an admin. It is not visible in the public catalogue ({p.status.replace(/_/g, " ")}).</Callout>}
      <ProjectImage category={p.category} title={p.title} src={p.image} className="h-48 rounded-card sm:h-64" />
      <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap gap-2"><Badge>{categoryLabel(p.category)}</Badge>{mock ? <MockStatusBadge status={mock.status} /> : <Badge tone="info">{STAGE_LABEL[p.stage]}</Badge>}</div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-900">{p.title}</h1>
          <p className="mt-1 max-w-2xl text-muted">{p.summary}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" aria-pressed={saved} onClick={toggleSave}><Heart className={saved ? "size-4 fill-brand-600 text-brand-600" : "size-4"} aria-hidden /> {saved ? "Saved" : "Save"}</Button>
          <Button variant="secondary" onClick={copyLink}><Copy className="size-4" aria-hidden /> Copy link</Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Section title="Overview">
            <p className="text-sm">{p.fullDescription ?? p.summary}</p>
            {(p.objectives ?? []).length > 0 && (<><h3 className="mt-4 text-sm font-semibold">Objectives</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{p.objectives!.map((o) => <li key={o}>{o}</li>)}</ul></>)}
            {(p.activities ?? []).length > 0 && (<><h3 className="mt-4 text-sm font-semibold">Key agricultural activities</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{p.activities!.map((o) => <li key={o}>{o}</li>)}</ul></>)}
            <h3 className="mt-4 text-sm font-semibold">Operational requirements</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{OPERATIONAL_REQUIREMENTS[p.category].map((o) => <li key={o}>{o}</li>)}</ul>
            <div className="mt-4"><DefList rows={[["Production method", p.productionMethod], ["District", p.district || "—"], ["Duration", durationLabel(p.durationMonths)], ["Season", p.season], ["Region", p.region]]} /></div>
            <Callout tone={p.certification.status === "reviewed" ? "ok" : "neutral"} title="Organic / certification status" className="mt-4">
              {p.certification.note} The platform does not describe a project as “certified organic” without verified evidence.
            </Callout>
          </Section>

          {mock && (
            <Section title="Timeline & budget (illustrative)">
              <DefList rows={[["Start date", formatDate(mock.startDate)], ["Estimated completion", formatDate(mock.estimatedCompletionDate)], ["Illustrative budget", formatINR(mock.budget)], ["Illustrative contributions", formatINR(mock.contributions)], ["Illustrative progress", mock.progress + "%"]]} />
              <p className="mt-3 text-xs text-muted">{MOCK_LABEL} Not a forecast, return or guarantee.</p>
            </Section>
          )}
          {mock && (
            <Section title="Performance (illustrative)">
              <p className="mb-3 text-xs text-muted">{MOCK_LABEL}</p>
              <HBarChart rows={[{ id: p.id, label: "Progress", value: mock.progress, color }]} max={100} unit="%" title="Project progress" description="Illustrative progress percentage." />
              <h3 className="mb-2 mt-5 text-sm font-semibold">Monthly illustrative trend</h3>
              <MultiLineChart labels={MONTHS} series={[{ key: p.id, label: p.title, color, values: mock.trend }]} title={p.title + " monthly trend"} description="Illustrative monthly activity index." />
              <h3 className="mb-2 mt-5 text-sm font-semibold">Activity history</h3>
              {history.length === 0 ? <p className="text-sm text-muted">No activities recorded.</p> : (
                <ul className="divide-y divide-line text-sm">{history.map((a) => <li key={a.id} className="flex flex-wrap justify-between gap-2 py-2"><span>{a.activity}</span><span className="text-muted">{formatDate(a.date)} · {a.status}</span></li>)}</ul>
              )}
            </Section>
          )}

          {p.milestones.length > 0 && <Section title="Production plan & milestones" defaultOpen={false}><MilestoneTimeline items={p.milestones} /></Section>}

          {p.analysis && (<><h2 className="pt-2 text-xl font-bold text-brand-900">Project analysis</h2>
          <ProjectAnalysisView project={p} /></>)}

          <Section title="Risks & mitigations" badge={<Badge tone={riskLabel(p) === "Higher" ? "warn" : "neutral"}>Risk label (demo): {riskLabel(p)}</Badge>}>
            {p.risks.length === 0 ? <p className="text-sm text-muted">No risks have been listed yet.</p> : (
              <ul className="space-y-3">{p.risks.map((r) => (<li key={r.id} className="rounded-control border border-line p-3 text-sm"><p className="font-semibold">{r.title} <Badge tone={r.severity === "high" ? "bad" : r.severity === "medium" ? "warn" : "neutral"} className="ml-1">{r.severity} severity</Badge></p><p className="mt-1 text-muted"><strong>Mitigation:</strong> {r.mitigation}</p></li>))}</ul>
            )}
            <details className="mt-3 text-xs text-muted"><summary className="cursor-pointer font-semibold">How is the demo risk label calculated?</summary><p className="mt-1">{RISK_METHOD}</p></details>
            <p className="mt-3 text-sm"><strong>What could go wrong:</strong> weather, disease or pests, price falls, delays, buyer non-payment and cost overruns can each reduce a project’s results. {COPY.noGuarantee}</p>
          </Section>

          {p.useOfFunds.length > 0 && <Section title="Use of funds" defaultOpen={false}>
            {p.useOfFunds.length === 0 ? <p className="text-sm text-muted">Use of funds has not been provided.</p> : (
              <table className="w-full text-sm"><caption className="sr-only">Planned use of funds</caption><tbody>{p.useOfFunds.map((u) => (<tr key={u.label} className="border-t border-line first:border-0"><th scope="row" className="py-2 text-left font-medium">{u.label}</th><td className="tabular py-2 text-right">{formatINR(u.amount)}</td></tr>))}</tbody></table>
            )}
          </Section>}

          <Section title="Updates & documents" defaultOpen={false}>
            {p.updates.length === 0 ? <p className="text-sm text-muted">No updates posted yet.</p> : <ul className="space-y-3">{p.updates.map((u) => (<li key={u.id} className="text-sm"><p className="font-semibold">{u.title} <span className="font-normal text-muted">· {formatDate(u.date)}</span></p><p className="text-muted">{u.body}</p></li>))}</ul>}
            <h3 className="mb-2 mt-5 text-sm font-semibold">Documents (demo placeholders)</h3>
            {p.documentTitles.length === 0 ? <p className="text-sm text-muted">No documents uploaded.</p> : <ul className="space-y-2">{p.documentTitles.map((t) => (<li key={t}><button type="button" onClick={() => setDoc(t)} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-700 hover:underline"><FileText className="size-4" aria-hidden /> {t}</button></li>))}</ul>}
          </Section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Project actions">
          {!p.funding && !p.demoConfig.investable ? (
            <Card className="space-y-3">
              <h2 className="text-lg font-bold text-brand-900">Project actions</h2>
              <Button className="w-full" onClick={() => setEnquire(true)}>Enquire About This Project</Button>
              <LinkButton href="/project-dashboard" variant="secondary" className="w-full">Back to Projects</LinkButton>
              <Callout tone="neutral">An enquiry is not a commitment. {COPY.noGuarantee} <Link href="/risk-disclosure" className="font-semibold underline">Risk disclosure</Link></Callout>
            </Card>
          ) : (
          <Card className="space-y-4">
            <h2 className="text-lg font-bold text-brand-900">Funding summary <span className="ml-1 rounded bg-neutral-bg px-1.5 py-0.5 text-[11px] text-neutral-fg">SAMPLE</span></h2>
            {p.funding ? (
              <>
                <div><p className="tabular text-2xl font-bold">{formatINR(p.funding.raised)}</p><p className="text-sm text-muted">of {formatINR(p.funding.target)} sample target · {formatINR(remaining)} remaining</p></div>
                <ProgressBar value={prog} label="Sample funding progress" />
              </>
            ) : <p className="text-sm text-muted">This project does not use a funding target.</p>}
            <dl className="text-sm"><div className="flex justify-between"><dt className="text-muted">Demo minimum</dt><dd className="tabular font-semibold">{formatINR(p.demoConfig.minAmount)}</dd></div><div className="flex justify-between"><dt className="text-muted">Demo maximum</dt><dd className="tabular font-semibold">{formatINR(p.demoConfig.maxAmount)}</dd></div></dl>

            {!p.demoConfig.investable ? (
              <div><Button disabled className="w-full" title={p.demoConfig.notInvestableReason}>Simulated investment unavailable</Button><p className="mt-2 text-xs text-muted">{p.demoConfig.notInvestableReason ?? "Not open for demo investment."}</p></div>
            ) : !session ? (
              <div><LinkButton href={`/login?next=${encodeURIComponent(`/investor/invest/${p.id}`)}`} className="w-full">Log in to simulate an investment</LinkButton><p className="mt-2 text-xs text-muted">You will return here after signing in.</p></div>
            ) : !isInvestor ? (
              <div><Button disabled className="w-full">Investor account required</Button><p className="mt-2 text-xs text-muted">You are signed in as a demo {session.role}. Use the account menu to switch to the investor demo role.</p></div>
            ) : (
              <LinkButton href={`/investor/invest/${p.id}`} className="w-full">Simulate an investment</LinkButton>
            )}
            <Callout tone="neutral">Demo only — no real payment is taken. {COPY.noGuarantee} <Link href="/risk-disclosure" className="font-semibold underline">Risk disclosure</Link></Callout>
          </Card>
          )}
        </aside>
      </div>
      <EnquiryModal open={enquire} onClose={() => setEnquire(false)} prefill={{ projectId: p.id, heading: p.title }} />
      <DemoDocumentPreview open={doc !== null} onClose={() => setDoc(null)} title={doc ?? ""} category="project document" />
      </div>
    </div>
  );
}
