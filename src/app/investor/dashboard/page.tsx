"use client";

import { useMemo, useState } from "react";
import { Callout } from "@/components/common/ui";
import {
  AdditionalStats, AgricultureBanner, CashFlowOverview, DashboardHeader, HealthIndicators, InvestmentActivity, InvestmentImpact, InvestmentsTable,
  PerformanceAnalytics, PortfolioAllocation, PortfolioChartCard, PrimaryCards, RecentActivity, SmartAgricultureCard, UpcomingMilestones,
  type ActivityRow, type Health, type MilestoneRow,
} from "@/components/dashboard/sections";
import { ContributionPlans } from "@/components/plans/ContributionPlans";
import { ProjectCatalogue } from "@/components/plans/ProjectCatalogue";
import { COPY, durationLabel } from "@/config/demo-config";
import { useDemo } from "@/context/DemoContext";
import { useInvestor } from "@/hooks/useInvestor";
import {
  allocation, averageInvestment, bestWorst, cashFlow, completedWithdrawals, fundingContribution, monthlyActivity, nearingMaturity,
  ownedProjectCount, pendingInvestmentRequests, portfolioGrowth, rangeStart, realisedReturns, totalReturn, type ActivityMetric, type RangeId,
} from "@/lib/dashboard-calculations";
import { projectById } from "@/lib/project-helpers";
import type { Project } from "@/types";

const OPEN_STATES = ["submitted_demo", "under_review_demo"];

export default function InvestorDashboard() {
  const { state } = useDemo();
  const d = useInvestor();
  const [range, setRange] = useState<RangeId>("ALL");
  const [now] = useState(() => new Date());

  const v = useMemo(() => {
    const projects = state.projects;
    const open = d.investments.filter((i) => i.status !== "exited_demo");
    const start = rangeStart(range, now);
    const today = now.toISOString().slice(0, 10);
    const held = [...new Set(open.map((i) => i.projectId))].map((id) => projectById(state, id)).filter((p): p is Project => !!p);
    const targets = held.map((p) => p.funding?.target).filter((t): t is number => typeof t === "number");
    const months = held.map((p) => p.durationMonths);

    const milestones: MilestoneRow[] = held
      .flatMap((p) => p.milestones.filter((m) => m.status !== "done").map((m) => ({ key: `${p.id}:${m.id}`, title: m.title, project: p.title, projectId: p.id, date: m.plannedDate, overdue: m.plannedDate.slice(0, 10) < today })))
      .sort((a, b) => a.date.localeCompare(b.date));

    const titleOf = (id?: string) => (id ? projectById(state, id)?.title : undefined);
    const txRows: ActivityRow[] = d.transactions.map((t) => ({
      key: t.id, tx: t, kind: t.type, date: t.createdAt, href: `/investor/transactions/${t.id}`, project: t.projectId ? projectById(state, t.projectId) : undefined,
      title: t.type === "investment" ? `Investment in ${titleOf(t.projectId) ?? "project"}` : t.type === "exit" ? `Exit request${titleOf(t.projectId) ? ` — ${titleOf(t.projectId)}` : ""}` : t.type === "withdrawal" ? "Withdrawal request" : t.type === "refund" ? "Refund" : "Adjustment",
      sub: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(t.amount),
    }));
    const updRows: ActivityRow[] = d.notifications.filter((n) => n.kind === "milestone").map((n) => ({ key: n.id, kind: "update", date: n.at, href: n.href ?? "/investor/notifications", title: "Project update received", sub: n.title }));
    const activity = [...txRows, ...updRows].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

    const bw = bestWorst(d.investments);
    const withProject = (r: NonNullable<typeof bw.best> | null) => (r ? { ...r, project: projectById(state, r.inv.projectId) } : null);
    const overdue = milestones.filter((m) => m.overdue);
    const nearing = nearingMaturity(d.investments, projects, now);
    const pendingReq = pendingInvestmentRequests(d.transactions);

    const attention: { text: string; href: string }[] = [];
    if (d.user && d.user.verification !== "approved_demo") attention.push({ text: "Demo verification is not complete", href: "/investor/bank-details#verification" });
    if (!d.user?.bank) attention.push({ text: "No demo bank account added", href: "/investor/bank-details" });
    if (d.exits.some((e) => OPEN_STATES.includes(e.status))) attention.push({ text: "An exit request is awaiting review (demo)", href: "/investor/transactions" });
    if (d.withdrawals.some((w) => OPEN_STATES.includes(w.status))) attention.push({ text: "A withdrawal is awaiting review (demo)", href: "/investor/transactions" });
    overdue.slice(0, 3).forEach((m) => attention.push({ text: `Milestone “${m.title}” (${m.project}) was planned for ${m.date.slice(0, 10)} and is not marked done`, href: `/projects/${m.projectId}` }));

    const health: Health[] = [
      { label: "Active investments", value: open.length, tone: "ok", href: "/investor/portfolio" },
      { label: "Completed (exited) investments", value: d.investments.length - open.length, tone: "ok" },
      { label: "Upcoming milestones", value: milestones.length - overdue.length, tone: "ok" },
      { label: "Overdue milestones", value: overdue.length, tone: "bad" },
      { label: "Nearing planned maturity (30 days)", value: nearing.length, tone: "warn" },
      { label: "Pending investment requests", value: pendingReq.count, tone: "warn", href: "/investor/transactions" },
    ];

    const src = { transactions: d.transactions, cash: d.cashEntries, withdrawals: d.withdrawals, history: d.history };
    const metrics: ActivityMetric[] = ["investments", "deposits", "withdrawals", "value"];
    return {
      held, milestones, activity, health, attention,
      points: d.history.filter((p) => start === null || p.date >= start),
      minInvestment: held.length ? Math.min(...held.map((p) => p.demoConfig.minAmount)) : null,
      fundingTarget: targets.length ? targets.reduce((a, b) => a + b, 0) : null,
      duration: months.length ? (Math.min(...months) === Math.max(...months) ? durationLabel(months[0]) : `${Math.min(...months)}–${durationLabel(Math.max(...months))}`) : "—",
      realised: realisedReturns(d.exits), total: totalReturn(d.investments, d.exits),
      growth: portfolioGrowth(d.history, start), best: withProject(bw.best), worst: withProject(bw.worst),
      withdrawnAll: completedWithdrawals(d.withdrawals), pendingReq, avg: averageInvestment(d.investments),
      flow: cashFlow(d.cashEntries, d.withdrawals, start),
      alloc: { project: allocation(d.investments, projects, "project"), category: allocation(d.investments, projects, "category"), region: allocation(d.investments, projects, "region") },
      series: Object.fromEntries(metrics.map((m) => [m, monthlyActivity(m, src, now)])) as Record<ActivityMetric, { key: string; value: number | null }[]>,
      impact: { projects: ownedProjectCount(d.investments), ...fundingContribution(d.investments, projects) },
      rows: [...d.investments].sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt)).slice(0, 6).map((inv) => ({ inv, project: projectById(state, inv.projectId) })),
    };
  }, [state, d, range, now]);

  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="-mx-4 -my-6 min-h-[calc(100dvh-4rem)] bg-[#F7F9F8] px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto grid max-w-[1500px] gap-6 xl:grid-cols-[minmax(0,68fr)_minmax(0,32fr)]">
        <div className="min-w-0 space-y-5">
          <DashboardHeader name={d.user?.name.split(" ")[0] ?? ""} greeting={greeting} />
          <AgricultureBanner />
          <PrimaryCards s={d.summary} />
          <PortfolioChartCard points={v.points} range={range} onRange={setRange} minInvestment={v.minInvestment} fundingTarget={v.fundingTarget} duration={v.duration} />
          <AdditionalStats realised={v.realised} withdrawn={v.withdrawnAll} pending={v.pendingReq} avg={v.avg} />
          <InvestmentsTable rows={v.rows} />
          <PerformanceAnalytics range={range} total={v.total} realised={v.realised} unrealised={d.summary.gain} growth={v.growth} best={v.best} worst={v.worst} />
          <div className="grid gap-5 2xl:grid-cols-2">
            <PortfolioAllocation data={v.alloc} />
            <InvestmentActivity series={v.series} />
          </div>
          <CashFlowOverview range={range} deposits={v.flow.deposits} withdrawn={v.flow.withdrawn} withdrawnCount={v.flow.withdrawnCount} net={v.flow.net} pendingWithdrawals={d.cash.pendingWithdrawals} available={d.cash.available} pendingProceeds={d.cash.pendingProceeds} />
          <InvestmentImpact projects={v.impact.projects} contributed={v.impact.contributed} target={v.impact.target} pct={v.impact.pct} />
        </div>
        <aside className="min-w-0 space-y-5" aria-label="Milestones and activity">
          <UpcomingMilestones items={v.milestones.slice(0, 5)} />
          <SmartAgricultureCard />
          <RecentActivity items={v.activity} />
          <HealthIndicators items={v.health} attention={v.attention} />
        </aside>
      </div>
      <div className="mx-auto mt-10 max-w-[1500px] space-y-12">
        <ContributionPlans />
        <ProjectCatalogue />
      </div>
      <Callout tone="neutral" className="mx-auto mt-6 max-w-[1500px]">Demo data. {COPY.noGuarantee}</Callout>
    </div>
  );
}
