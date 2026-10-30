"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  AlertTriangle, ArrowLeftRight, ArrowRight, Banknote, Calculator, CalendarDays, CheckCircle2, ChevronRight, FileText, Flag, Hourglass,
  Layers, Leaf, LineChart, MapPin, Ruler, Sprout, Target, TrendingDown, TrendingUp, Users, Wallet, type LucideIcon,
} from "lucide-react";
import { Badge, Button, EmptyState, ProgressBar, type Tone } from "@/components/common/ui";
import { TransactionStatusBadge } from "@/components/common/badges";
import { ProjectImage } from "@/components/common/visuals";
import { Donut, MonthlyBars, ValueLineChart } from "@/components/dashboard/charts";
import { categoryLabel, durationLabel, INVESTMENT_STATUS_LABEL, COPY } from "@/config/demo-config";
import { cn } from "@/lib/cn";
import { formatDate, formatINR, formatPercent, formatSignedINR } from "@/lib/format";
import type { ActivityMetric, AllocationBy, RangeId } from "@/lib/dashboard-calculations";
import { gainLossPercent } from "@/lib/portfolio-calculations";
import type { MockInvestment, MockTransaction, Project } from "@/types";

/* ---------- shared bits ---------- */
export function Panel({ title, action, children, className, id }: { title?: string; action?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} aria-label={title} className={cn("min-w-0 rounded-card border border-line bg-white p-4 shadow-sm sm:p-5", className)}>
      {title && <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2"><h2 className="text-base font-bold text-ink">{title}</h2>{action}</div>}
      {children}
    </section>
  );
}
export const ViewAll = ({ href }: { href: string }) => <Link href={href} className="inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">View all <ArrowRight className="size-3.5" aria-hidden /></Link>;

const tint = (v: number | null) => (v === null || v === 0 ? "text-ink" : v > 0 ? "text-ok-fg" : "text-bad-fg");

function Metric({ icon: Icon, label, value, note, valueClass, compact }: { icon: LucideIcon; label: string; value: ReactNode; note?: ReactNode; valueClass?: string; compact?: boolean }) {
  return (
    <div className={cn("min-w-0 rounded-card border border-line bg-white shadow-sm", compact ? "p-3" : "p-4")}>
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700"><Icon className="size-4" aria-hidden /></span>
        <p className="truncate text-[0.6875rem] font-bold uppercase tracking-wide text-muted">{label}</p>
      </div>
      <p className={cn("tabular mt-2 truncate font-bold text-ink", compact ? "text-lg" : "text-2xl", valueClass)}>{value}</p>
      {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
    </div>
  );
}

export function RangeTabs({ value, onChange }: { value: RangeId; onChange: (r: RangeId) => void }) {
  return (
    <div role="group" aria-label="Date range" className="inline-flex rounded-full bg-brand-50 p-0.5">
      {(["ALL", "3M", "6M", "1Y"] as RangeId[]).map((r) => (
        <button key={r} type="button" aria-pressed={value === r} onClick={() => onChange(r)} className={cn("min-h-9 min-w-12 rounded-full px-3 text-xs font-bold", value === r ? "bg-brand-600 text-white" : "text-muted hover:text-ink")}>{r === "ALL" ? "All" : r}</button>
      ))}
    </div>
  );
}
const RANGE_NAME: Record<RangeId, string> = { ALL: "all time", "3M": "the last 3 months", "6M": "the last 6 months", "1Y": "the last 12 months" };
export const rangeName = (r: RangeId) => RANGE_NAME[r];

/* ---------- header + banner ---------- */
export function DashboardHeader({ name, greeting }: { name: string; greeting: string }) {
  return (
    <header>
      <p className="text-sm text-muted">{greeting},</p>
      <h1 className="text-2xl font-bold leading-tight text-ink">{name} <span aria-hidden>👋</span></h1>
      <p className="mt-0.5 text-sm text-muted">Here&apos;s a quick look at your investments and portfolio performance.</p>
    </header>
  );
}

/** Drawn landscape (no photograph is shipped with the app): sky, hills and crop rows. */
export function AgricultureBanner() {
  return (
    <div className="relative isolate flex min-h-28 items-center overflow-hidden rounded-card border border-line">
      <svg aria-hidden viewBox="0 0 800 120" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 -z-10 size-full">
        <defs>
          <linearGradient id="bn-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E8F4EA" /><stop offset="100%" stopColor="#CFE6D3" /></linearGradient>
          <linearGradient id="bn-field" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7DB46C" /><stop offset="100%" stopColor="#2E7D32" /></linearGradient>
          <pattern id="bn-rows" width="14" height="120" patternUnits="userSpaceOnUse" patternTransform="skewX(-24)"><rect width="5" height="120" fill="#1B5E20" opacity="0.16" /></pattern>
        </defs>
        <rect width="800" height="120" fill="url(#bn-sky)" />
        <path d="M0 62 Q120 40 240 58 T520 54 T800 56 V120 H0Z" fill="#9CC79A" />
        <path d="M0 74 Q200 58 400 72 T800 68 V120 H0Z" fill="url(#bn-field)" />
        <path d="M0 74 Q200 58 400 72 T800 68 V120 H0Z" fill="url(#bn-rows)" />
      </svg>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white/85 via-white/40 to-transparent" aria-hidden />
      <div className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <p className="text-lg font-bold leading-snug text-ink">Growing together<br className="hidden sm:block" /> for a sustainable future</p>
          <p className="mt-1 text-xs text-ink/80">Invest in agriculture. Support farmers. Build wealth.</p>
        </div>
        <Link href="/projects" className="inline-flex min-h-10 items-center gap-1.5 rounded-control bg-white px-4 text-sm font-semibold text-brand-800 shadow-card hover:bg-brand-50">Explore Projects <ArrowRight className="size-4" aria-hidden /></Link>
      </div>
    </div>
  );
}

/* ---------- summary cards ---------- */
export function PrimaryCards({ s }: { s: { invested: number; value: number; gain: number; gainPct: number | null; activeCount: number } }) {
  const up = s.gain >= 0;
  return (
    <section aria-label="Summary" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Metric icon={Wallet} label="Amount invested" value={formatINR(s.invested)} note="Original amount in open positions" />
      <Metric icon={LineChart} label="Est. portfolio value" value={formatINR(s.value)} note="Sample valuation — not a sale price" />
      <Metric icon={up ? TrendingUp : TrendingDown} label="Unrealised gain / loss" value={`${formatSignedINR(s.gain)} (${formatPercent(s.gainPct, 2, true)})`} valueClass={cn("text-lg sm:text-xl", tint(s.gain))} note="Estimated value minus original amount" />
      <Metric icon={Layers} label="Active investments" value={s.activeCount} note="Simulated positions" />
    </section>
  );
}

export function AdditionalStats(p: {
  realised: { amount: number; pct: number | null; count: number }; withdrawn: { amount: number; count: number };
  pending: { amount: number; count: number }; avg: { average: number | null; count: number };
}) {
  return (
    <section aria-label="Investment statistics" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Metric compact icon={CheckCircle2} label="Realised returns" value={p.realised.count ? formatSignedINR(p.realised.amount) : "—"} valueClass={tint(p.realised.count ? p.realised.amount : null)} note={p.realised.count ? `${formatPercent(p.realised.pct, 2, true)} on ${p.realised.count} settled exit${p.realised.count === 1 ? "" : "s"}` : "No settled exits yet"} />
      <Metric compact icon={Banknote} label="Total withdrawals" value={formatINR(p.withdrawn.amount)} note={`${p.withdrawn.count} completed withdrawal${p.withdrawn.count === 1 ? "" : "s"}`} />
      <Metric compact icon={Hourglass} label="Pending investments" value={formatINR(p.pending.amount)} note={`${p.pending.count} request${p.pending.count === 1 ? "" : "s"} awaiting processing`} />
      <Metric compact icon={Calculator} label="Average investment" value={p.avg.average === null ? "—" : formatINR(p.avg.average)} note={`Across ${p.avg.count} open position${p.avg.count === 1 ? "" : "s"}`} />
    </section>
  );
}

/* ---------- portfolio chart ---------- */
export function PortfolioChartCard(p: { points: { date: string; value: number }[]; range: RangeId; onRange: (r: RangeId) => void; minInvestment: number | null; fundingTarget: number | null; duration: string }) {
  return (
    <Panel title="Portfolio Value Over Time" action={<RangeTabs value={p.range} onChange={p.onRange} />}>
      {p.points.length < 2 ? (
        <EmptyState title="Not enough history for this period" body="At least two valuation records in the selected range are needed to draw the chart. Nothing is estimated in between." action={p.range !== "ALL" ? <Button variant="secondary" onClick={() => p.onRange("ALL")}>Show all time</Button> : undefined} />
      ) : (
        <>
          <ValueLineChart points={p.points} label={`Sample estimated portfolio value from ${formatDate(p.points[0].date)} to ${formatDate(p.points[p.points.length - 1].date)}, ending at ${formatINR(p.points[p.points.length - 1].value)}.`} />
          <p className="mt-1 text-xs text-muted">Sum of the latest sample valuation of each open position. New investments add to the line, so it is not a return. Demo data.</p>
        </>
      )}
      <dl className="mt-4 grid grid-cols-1 divide-y divide-line border-t border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {[
          [Wallet, "Lowest minimum investment (your projects)", p.minInvestment === null ? "—" : formatINR(p.minInvestment)],
          [Target, "Combined funding targets (your projects)", p.fundingTarget === null ? "—" : formatINR(p.fundingTarget)],
          [CalendarDays, "Project duration", p.duration],
        ].map(([Icon, k, v]) => {
          const I = Icon as LucideIcon;
          return <div key={k as string} className="flex items-center gap-3 px-3 py-3 first:pl-0"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700"><I className="size-4" aria-hidden /></span><div className="min-w-0"><dd className="tabular truncate text-sm font-bold text-ink">{v as string}</dd><dt className="text-xs text-muted">{k as string}</dt></div></div>;
        })}
      </dl>
    </Panel>
  );
}

/* ---------- performance analytics ---------- */
type Perf = { inv: MockInvestment; pct: number; project?: Project } | null;
export function PerformanceAnalytics(p: {
  range: RangeId;
  total: { amount: number; pct: number | null; basis: number };
  realised: { amount: number; count: number }; unrealised: number;
  growth: { change: number; pct: number | null; from: { date: string }; to: { date: string } } | null;
  best: Perf; worst: Perf;
}) {
  const card = (label: string, value: ReactNode, note: ReactNode, cls?: string) => (
    <div className="min-w-0 rounded-card border border-line p-3"><p className="text-[0.6875rem] font-bold uppercase tracking-wide text-muted">{label}</p><p className={cn("tabular mt-1 truncate text-lg font-bold", cls)}>{value}</p><p className="mt-0.5 text-xs text-muted">{note}</p></div>
  );
  const perf = (label: string, r: Perf, empty: string) => (
    <div className="min-w-0 rounded-card border border-line p-3">
      <p className="text-[0.6875rem] font-bold uppercase tracking-wide text-muted">{label}</p>
      {r?.project ? (
        <div className="mt-2 flex items-center gap-3">
          <ProjectImage category={r.project.category} title={r.project.title} className="size-10 shrink-0 rounded-lg" />
          <div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{r.project.title}</p><p className="tabular text-xs text-muted"><span className={cn("font-bold", tint(r.pct))}>{formatPercent(r.pct, 2, true)}</span> · {formatINR(r.inv.originalAmount)} invested</p></div>
        </div>
      ) : <p className="mt-2 text-sm text-muted">{empty}</p>}
    </div>
  );
  return (
    <Panel title="Portfolio Performance">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {card("Total portfolio return", formatSignedINR(p.total.amount), `${formatPercent(p.total.pct, 2, true)} simple return on ${formatINR(p.total.basis)} cost basis (realised + unrealised). Not time- or money-weighted.`, tint(p.total.amount))}
        {card("Realised profit / loss", p.realised.count ? formatSignedINR(p.realised.amount) : "—", p.realised.count ? `${p.realised.count} settled exit${p.realised.count === 1 ? "" : "s"}, net of fees` : "No settled exits yet", tint(p.realised.count ? p.realised.amount : null))}
        {card("Unrealised profit / loss", formatSignedINR(p.unrealised), "Estimated value minus original amount, open positions", tint(p.unrealised))}
        {card("Portfolio growth", p.growth ? formatSignedINR(p.growth.change) : "—", p.growth ? `Change in estimated value, ${formatDate(p.growth.from.date)} to ${formatDate(p.growth.to.date)}. Includes new money invested, so no percentage is shown.` : `Not enough history in ${rangeName(p.range)}`, tint(p.growth?.change ?? null))}
        {perf("Best-performing investment", p.best, "No open positions")}
        {perf("Lowest-performing investment", p.worst, "Needs at least two open positions")}
      </div>
      <p className="mt-3 text-xs text-muted">Return figures use sample valuations, are estimates, and are not guaranteed. A lower-performing position is not necessarily unsafe.</p>
    </Panel>
  );
}

/* ---------- investments table ---------- */
export function InvestmentsTable({ rows }: { rows: { inv: MockInvestment; project: Project | undefined }[] }) {
  return (
    <Panel title="Your Investments" action={<ViewAll href="/investor/portfolio" />}>
      {rows.length === 0 ? <EmptyState title="No investments yet" body="Your simulated positions will appear here." action={<Link href="/projects" className="text-sm font-semibold text-brand-700 underline">Browse projects</Link>} /> : (
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[640px] text-sm">
            <caption className="sr-only">Your investments</caption>
            <thead><tr className="text-left text-[0.6875rem] font-bold uppercase tracking-wide text-muted"><th className="pb-2 pr-3">Project</th><th className="pb-2 pr-3">Location</th><th className="pb-2 pr-3 text-right">Invested</th><th className="pb-2 pr-3 text-right">Est. return</th><th className="pb-2 pr-3">Duration</th><th className="pb-2">Status</th></tr></thead>
            <tbody>
              {rows.map(({ inv, project: p }) => {
                const pct = gainLossPercent(inv.currentEstimatedValue, inv.originalAmount);
                const tone: Tone = inv.status === "active_demo" ? "ok" : "neutral";
                return (
                  <tr key={inv.id} className="border-t border-line">
                    <td className="py-2 pr-3"><Link href={`/investor/portfolio/${inv.id}`} className="flex items-center gap-3 hover:underline">{p && <ProjectImage category={p.category} title={p.title} className="size-9 shrink-0 rounded-lg" />}<span className="min-w-0"><span className="block truncate font-semibold text-ink">{p?.title ?? "Unknown project"}</span><span className="block truncate text-xs text-muted">{p ? categoryLabel(p.category) : ""}</span></span></Link></td>
                    <td className="py-2 pr-3 text-muted"><span className="inline-flex items-center gap-1"><MapPin className="size-3.5 shrink-0" aria-hidden /> {p?.location ?? "—"}</span></td>
                    <td className="tabular py-2 pr-3 text-right font-semibold">{formatINR(inv.originalAmount)}</td>
                    <td className="tabular py-2 pr-3 text-right"><span className={cn("font-semibold", tint(pct))}>{formatPercent(pct, 2, true)}</span><span className="block text-[0.6875rem] text-muted">estimate, not guaranteed</span></td>
                    <td className="py-2 pr-3 text-muted">{p ? durationLabel(p.durationMonths) : "—"}</td>
                    <td className="py-2"><Badge tone={tone}>{INVESTMENT_STATUS_LABEL[inv.status]}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

/* ---------- right column ---------- */
export type MilestoneRow = { key: string; title: string; project: string; projectId: string; date: string; overdue: boolean };
export function UpcomingMilestones({ items }: { items: MilestoneRow[] }) {
  return (
    <Panel title="Upcoming Milestones" action={<ViewAll href="/investor/portfolio" />}>
      {items.length === 0 ? <p className="text-sm text-muted">No upcoming milestones for your projects.</p> : (
        <ol className="relative space-y-1 before:absolute before:bottom-4 before:left-[5px] before:top-4 before:w-px before:bg-line">
          {items.map((m) => (
            <li key={m.key}>
              <Link href={`/projects/${m.projectId}`} className="relative flex min-h-12 items-center gap-3 rounded-lg py-2 pl-5 pr-1 hover:bg-brand-50">
                <span aria-hidden className={cn("absolute left-0 top-1/2 size-[11px] -translate-y-1/2 rounded-full border-2 border-white", m.overdue ? "bg-warn-fg" : "bg-brand-600")} />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-ink">{m.title}</span><span className="block truncate text-xs text-muted">{m.project}</span></span>
                <span className="shrink-0 text-right text-xs text-muted">{formatDate(m.date)}{m.overdue && <span className="block font-semibold text-warn-fg">Overdue</span>}</span>
                <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

export function SmartAgricultureCard() {
  return (
    <div className="relative overflow-hidden rounded-card border border-line bg-brand-100 p-5">
      <Leaf className="size-5 text-brand-700" aria-hidden />
      <p className="mt-2 text-base font-bold leading-snug text-ink">Smart Investing<br />in Agriculture</p>
      <ul className="mt-2 space-y-1 text-xs text-ink/80">{["Support farmers", "Empower communities", "Build a sustainable future"].map((t) => <li key={t} className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-brand-600" aria-hidden /> {t}</li>)}</ul>
      <Sprout className="absolute -bottom-3 right-1 size-24 text-brand-600/20" strokeWidth={1} aria-hidden />
    </div>
  );
}

export type ActivityRow = { key: string; title: string; sub: string; date: string; href: string; project?: Project; tx?: MockTransaction; kind: "investment" | "exit" | "withdrawal" | "refund" | "adjustment" | "update" };
const ACT_ICON: Record<ActivityRow["kind"], LucideIcon> = { investment: Wallet, exit: ArrowLeftRight, withdrawal: Banknote, refund: ArrowLeftRight, adjustment: FileText, update: Flag };
export function RecentActivity({ items }: { items: ActivityRow[] }) {
  return (
    <Panel title="Recent Activity" action={<ViewAll href="/investor/transactions" />}>
      {items.length === 0 ? <p className="text-sm text-muted">No activity yet.</p> : (
        <ul className="divide-y divide-line">
          {items.map((a) => {
            const Icon = ACT_ICON[a.kind];
            return (
              <li key={a.key}>
                <Link href={a.href} className="flex min-h-14 items-center gap-3 py-2.5 hover:bg-brand-50/60">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700"><Icon className="size-4" aria-hidden /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-ink">{a.title}</span><span className="block truncate text-xs text-muted">{formatDate(a.date)} · {a.sub}</span></span>
                  {a.tx ? <TransactionStatusBadge status={a.tx.status} /> : <Badge tone="neutral">Update</Badge>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export type Health = { label: string; value: number; tone: Tone; href?: string };
export function HealthIndicators({ items, attention }: { items: Health[]; attention: { text: string; href: string }[] }) {
  return (
    <Panel title="Investment Overview">
      <ul className="divide-y divide-line">
        {items.map((h) => (
          <li key={h.label} className="flex items-center justify-between gap-3 py-2 text-sm">
            {h.href ? <Link href={h.href} className="text-ink hover:underline">{h.label}</Link> : <span className="text-ink">{h.label}</span>}
            <Badge tone={h.value === 0 && h.tone !== "ok" ? "neutral" : h.tone}>{h.value}</Badge>
          </li>
        ))}
      </ul>
      <h3 className="mb-1.5 mt-4 text-xs font-bold uppercase tracking-wide text-muted">Needs your attention</h3>
      {attention.length === 0 ? <p className="text-sm text-muted">Nothing is waiting on you.</p> : (
        <ul className="space-y-1.5">{attention.map((a) => <li key={a.text}><Link href={a.href} className="flex items-start gap-2 rounded-control bg-warn-bg px-3 py-2 text-xs font-semibold text-warn-fg hover:underline"><AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden /> {a.text}</Link></li>)}</ul>
      )}
    </Panel>
  );
}

/* ---------- cash flow / allocation / activity / impact ---------- */
export function CashFlowOverview(p: { range: RangeId; deposits: number; withdrawn: number; withdrawnCount: number; net: number; pendingWithdrawals: number; available: number; pendingProceeds: number }) {
  return (
    <Panel title="Cash Flow Overview" action={<span className="text-xs text-muted">Deposits &amp; withdrawals: {rangeName(p.range)}</span>}>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <Metric compact icon={Wallet} label="Total deposits" value={formatINR(p.deposits)} note="Demo opening balance credited" />
        <Metric compact icon={Banknote} label="Total withdrawals" value={formatINR(p.withdrawn)} note={`${p.withdrawnCount} completed`} />
        <Metric compact icon={ArrowLeftRight} label="Net external cash flow" value={formatSignedINR(p.net)} valueClass={tint(p.net)} note="Deposits − completed withdrawals" />
        <Metric compact icon={Hourglass} label="Pending withdrawals" value={formatINR(p.pendingWithdrawals)} note="Already reserved from cash" />
        <Metric compact icon={Banknote} label="Available cash" value={formatINR(p.available)} note="Settled, withdrawable" />
        <Metric compact icon={Hourglass} label="Pending exit proceeds" value={formatINR(p.pendingProceeds)} note="Not available until settled" />
      </div>
      <p className="mt-3 text-xs text-muted">Available cash, reserved withdrawals and unsettled proceeds are separate balances and are never added to portfolio value or to each other.</p>
    </Panel>
  );
}

export function PortfolioAllocation({ data }: { data: Record<AllocationBy, { total: number; rows: { label: string; value: number; pct: number }[] }> }) {
  const [by, setBy] = useState<AllocationBy>("project");
  const d = data[by];
  return (
    <Panel title="Portfolio Allocation" action={
      <div role="group" aria-label="Group by" className="inline-flex rounded-full bg-brand-50 p-0.5">
        {([["project", "Project"], ["category", "Category"], ["region", "Region"]] as [AllocationBy, string][]).map(([k, l]) => (
          <button key={k} type="button" aria-pressed={by === k} onClick={() => setBy(k)} className={cn("min-h-9 rounded-full px-3 text-xs font-bold", by === k ? "bg-brand-600 text-white" : "text-muted hover:text-ink")}>{l}</button>
        ))}
      </div>
    }>
      {d.rows.length === 0 ? <p className="text-sm text-muted">No open positions to allocate.</p> : <Donut rows={d.rows} total={d.total} label={`Allocation of estimated value by ${by}`} />}
    </Panel>
  );
}

const METRIC_LABEL: Record<ActivityMetric, string> = { investments: "Investments", deposits: "Deposits", withdrawals: "Withdrawals", value: "Portfolio Value" };
export function InvestmentActivity({ series }: { series: Record<ActivityMetric, { key: string; value: number | null }[]> }) {
  const [m, setM] = useState<ActivityMetric>("investments");
  const rows = series[m];
  const empty = rows.length === 0 || rows.every((r) => !r.value);
  return (
    <Panel title="Investment Activity" action={
      <div role="group" aria-label="Metric" className="inline-flex flex-wrap rounded-full bg-brand-50 p-0.5">
        {(Object.keys(METRIC_LABEL) as ActivityMetric[]).map((k) => (
          <button key={k} type="button" aria-pressed={m === k} onClick={() => setM(k)} className={cn("min-h-9 rounded-full px-3 text-xs font-bold", m === k ? "bg-brand-600 text-white" : "text-muted hover:text-ink")}>{METRIC_LABEL[k]}</button>
        ))}
      </div>
    }>
      {empty ? <EmptyState title={`No ${METRIC_LABEL[m].toLowerCase()} recorded`} body="There are no records for this measure in the last 12 months." /> : (
        <>
          <MonthlyBars rows={rows} label={`${METRIC_LABEL[m]} by month`} />
          <p className="mt-1 text-xs text-muted">{m === "value" ? "Estimated value at each month end (sample valuations)." : `${METRIC_LABEL[m]} recorded in each month.`} Built from your records only.</p>
        </>
      )}
    </Panel>
  );
}

export function InvestmentImpact(p: { projects: number; contributed: number; target: number; pct: number | null }) {
  const na = <span className="text-sm font-semibold text-muted">Not available</span>;
  return (
    <Panel title="Your Investment Impact">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric compact icon={Sprout} label="Projects funded" value={p.projects} note="Distinct open projects" />
        <Metric compact icon={Users} label="Farmers supported" value={na} note="Not recorded in project data" />
        <Metric compact icon={Ruler} label="Land under cultivation" value={na} note="Not recorded in project data" />
        <Metric compact icon={Target} label="Funding contribution" value={p.pct === null ? "—" : `${p.pct.toFixed(p.pct < 1 ? 2 : 1)}%`} note={p.target > 0 ? `${formatINR(p.contributed)} of ${formatINR(p.target)} sample targets` : "No funding target"} />
      </div>
      {p.pct !== null && <div className="mt-3"><ProgressBar value={Math.min(100, p.pct)} label="Share of combined sample funding targets contributed by you" /></div>}
      <p className="mt-3 text-xs text-muted">Only recorded project data is shown. Farmer counts and land area are not estimated from investment amounts. {COPY.noGuarantee}</p>
    </Panel>
  );
}
