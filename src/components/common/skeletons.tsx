"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/common/ui";
import { cn } from "@/lib/cn";

/**
 * Layout-matched loading placeholders. They render only while the demo store is hydrating from browser
 * storage (DemoContext `ready === false`) or while a route segment is loading — never on a timer.
 */

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Announces the loading state once; every block inside is aria-hidden. */
export function SkeletonRegion({ label = "Loading…", className, children }: { label?: string; className?: string; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/* ---------- building blocks ---------- */

export function PageTitleSkeleton({ actions = false }: { actions?: boolean }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-8 w-48 max-w-full sm:h-9" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      {actions && <Skeleton className="h-11 w-36" />}
    </div>
  );
}

export function TextLinesSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {range(lines).map((i) => <Skeleton key={i} className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")} />)}
    </div>
  );
}

/** Mirrors the dashboard Metric / StatCard tiles. */
export function StatCardSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className={cn("min-w-0 rounded-card border border-line bg-white shadow-sm", compact ? "p-3" : "p-4")}>
      <div className="flex items-center gap-2.5">
        <Skeleton className="size-8 shrink-0 rounded-lg" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className={cn("mt-2.5", compact ? "h-6 w-20" : "h-8 w-28")} />
      <Skeleton className="mt-2 h-3 w-32 max-w-full" />
    </div>
  );
}

export function StatCardsSkeleton({ count = 4, compact, className = "grid grid-cols-2 gap-3 xl:grid-cols-4" }: { count?: number; compact?: boolean; className?: string }) {
  return <div className={className}>{range(count).map((i) => <StatCardSkeleton key={i} compact={compact} />)}</div>;
}

/** Section card with a title row, like dashboard `Panel`. */
export function PanelSkeleton({ className, bodyClassName = "h-48", action = true, children }: { className?: string; bodyClassName?: string; action?: boolean; children?: ReactNode }) {
  return (
    <div className={cn("min-w-0 rounded-card border border-line bg-white p-4 shadow-sm sm:p-5", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-40" />
        {action && <Skeleton className="h-4 w-14" />}
      </div>
      {children ?? <Skeleton className={cn("w-full", bodyClassName)} />}
    </div>
  );
}

export function FieldSkeleton({ className, tall }: { className?: string; tall?: boolean }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className={cn("w-full", tall ? "h-28" : "h-11")} />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5, search = false }: { rows?: number; cols?: number; search?: boolean }) {
  return (
    <div className="rounded-card border border-line bg-white shadow-card">
      {search && <div className="border-b border-line p-3"><Skeleton className="h-11 w-full max-w-sm" /></div>}
      <div className="flex gap-4 border-b border-line px-4 py-3">{range(cols).map((c) => <Skeleton key={c} className="h-3 flex-1" />)}</div>
      {range(rows).map((r) => (
        <div key={r} className="flex items-center gap-4 border-b border-line px-4 py-3.5 last:border-b-0">
          {range(cols).map((c) => <Skeleton key={c} className={cn("flex-1", c === 0 ? "h-9" : "h-4")} />)}
        </div>
      ))}
    </div>
  );
}

/** Rows of icon + two text lines + trailing badge (notifications, transactions, activity). */
export function ListSkeleton({ rows = 4, card = true }: { rows?: number; card?: boolean }) {
  return (
    <ul className={card ? "space-y-3" : "divide-y divide-line"}>
      {range(rows).map((i) => (
        <li key={i} className={cn("flex items-start gap-3", card ? "rounded-card border border-line bg-white p-4 shadow-card" : "py-3")}>
          <Skeleton className="size-5 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3.5 w-5/6" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

export function DefListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {range(rows).map((i) => <div key={i} className="space-y-1.5"><Skeleton className="h-3 w-24" /><Skeleton className="h-4 w-36 max-w-full" /></div>)}
    </div>
  );
}

/** Mirrors the catalogue / wishlist project card: 16:9 image, badge, title, summary, activities, two buttons. */
export function ProjectCardSkeleton() {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-card border border-line bg-white shadow-card">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-6 w-3/4" />
        <TextLinesSkeleton lines={3} />
        <div className="space-y-1.5"><Skeleton className="h-3 w-24" />{range(3).map((i) => <Skeleton key={i} className="h-3.5 w-2/3" />)}</div>
        <div className="mt-auto flex gap-2 pt-2"><Skeleton className="h-11 flex-1" /><Skeleton className="h-11 flex-1" /></div>
      </div>
    </div>
  );
}

export function ProjectCardGridSkeleton({ count = 6, label = "Loading projects…" }: { count?: number; label?: string }) {
  return (
    <SkeletonRegion label={label}>
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {range(count).map((i) => <li key={i} className="flex"><ProjectCardSkeleton /></li>)}
      </ul>
    </SkeletonRegion>
  );
}

/* ---------- page skeletons (investor workspace) ---------- */

export function DashboardSkeleton() {
  return (
    <SkeletonRegion label="Loading your dashboard…" className="-mx-4 -my-6 min-h-[calc(100dvh-4rem)] bg-[#F7F9F8] px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto grid max-w-[1500px] gap-6 xl:grid-cols-[minmax(0,68fr)_minmax(0,32fr)]">
        <div className="min-w-0 space-y-5">
          <div className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-7 w-44" /><Skeleton className="h-4 w-80 max-w-full" /></div>
          <Skeleton className="h-28 w-full rounded-card" />
          <StatCardsSkeleton />
          <PanelSkeleton bodyClassName="h-64" />
          <StatCardsSkeleton compact />
          <PanelSkeleton><TableSkeleton rows={4} cols={6} /></PanelSkeleton>
        </div>
        <div className="min-w-0 space-y-5">
          <PanelSkeleton><ListSkeleton rows={4} card={false} /></PanelSkeleton>
          <Skeleton className="h-40 w-full rounded-card" />
          <PanelSkeleton><ListSkeleton rows={4} card={false} /></PanelSkeleton>
        </div>
      </div>
    </SkeletonRegion>
  );
}

export function PortfolioSkeleton() {
  return (
    <SkeletonRegion label="Loading your portfolio…">
      <PageTitleSkeleton actions />
      <StatCardsSkeleton />
      <Skeleton className="mb-6 mt-3 h-4 w-full max-w-2xl" />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><FieldSkeleton /><FieldSkeleton /></div>
      <TableSkeleton rows={5} cols={7} search />
    </SkeletonRegion>
  );
}

export function InvestmentDetailSkeleton() {
  return (
    <SkeletonRegion label="Loading investment details…">
      <Skeleton className="mb-4 h-4 w-48" />
      <PageTitleSkeleton actions />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {range(4).map((i) => <div key={i} className="rounded-card border border-line bg-white p-5 shadow-card"><Skeleton className="h-3 w-28" /><Skeleton className="mt-2 h-8 w-32" /><Skeleton className="mt-2 h-3 w-20" /></div>)}
      </div>
      <Skeleton className="mt-4 h-16 w-full rounded-card" />
      <div className="mt-6 flex gap-2 border-b border-line pb-2">{range(4).map((i) => <Skeleton key={i} className="h-9 w-28" />)}</div>
      <div className="space-y-6 pt-5"><Skeleton className="h-64 w-full rounded-card" /><DefListSkeleton rows={8} /></div>
    </SkeletonRegion>
  );
}

export function ProfileSkeleton() {
  const card = "rounded-card border border-line bg-white p-6 shadow-card";
  return (
    <SkeletonRegion label="Loading your profile…">
      <PageTitleSkeleton />
      <div className={cn(card, "grid max-w-4xl items-start gap-6 md:grid-cols-2")}>
        {range(4).map((i) => <FieldSkeleton key={i} />)}
        <Skeleton className="h-5 w-3/4 md:col-span-2" />
        <Skeleton className="h-11 w-36" />
      </div>
      <div className="mt-6 grid max-w-4xl gap-6 md:grid-cols-2">
        {range(2).map((i) => <div key={i} className={card}><Skeleton className="h-6 w-44" /><div className="mt-4"><DefListSkeleton /></div><Skeleton className="mt-4 h-4 w-40" /></div>)}
      </div>
    </SkeletonRegion>
  );
}

export function NotificationsSkeleton() {
  return (
    <SkeletonRegion label="Loading notifications…">
      <PageTitleSkeleton actions />
      <div className="mb-4 flex gap-2"><Skeleton className="h-11 w-24" /><Skeleton className="h-11 w-28" /></div>
      <ListSkeleton rows={5} />
    </SkeletonRegion>
  );
}

export function TransactionsSkeleton() {
  return (
    <SkeletonRegion label="Loading transactions…">
      <PageTitleSkeleton />
      <div className="mb-4 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,20rem)_minmax(0,20rem)_minmax(0,1fr)]"><FieldSkeleton /><FieldSkeleton /><Skeleton className="h-11 w-full sm:col-span-2 lg:col-span-1" /></div>
      <TableSkeleton rows={6} cols={6} />
    </SkeletonRegion>
  );
}

export function CashSkeleton() {
  return (
    <SkeletonRegion label="Loading cash balance…">
      <PageTitleSkeleton actions />
      <StatCardsSkeleton count={3} className="grid gap-4 sm:grid-cols-3" />
      <Skeleton className="mt-4 h-14 w-full rounded-card" />
      <Skeleton className="mt-4 h-28 w-full rounded-card" />
      <Skeleton className="mb-3 mt-8 h-6 w-56" />
      <TableSkeleton rows={5} cols={5} search />
    </SkeletonRegion>
  );
}

export function FormPageSkeleton({ label = "Loading…", fields = 3, centered }: { label?: string; fields?: number; centered?: boolean }) {
  return (
    <SkeletonRegion label={label} className={centered ? "mx-auto max-w-2xl" : "max-w-3xl"}>
      <PageTitleSkeleton />
      <div className="space-y-5 rounded-card border border-line bg-white p-5 shadow-card sm:p-8">
        {range(fields).map((i) => <FieldSkeleton key={i} tall={i === fields - 1} />)}
        <Skeleton className="h-14 w-full" />
        <div className="flex justify-end"><Skeleton className="h-11 w-full sm:w-36" /></div>
      </div>
    </SkeletonRegion>
  );
}

export function WishlistSkeleton() {
  return (
    <div>
      <PageTitleSkeleton actions />
      <ProjectCardGridSkeleton count={3} label="Loading your wishlist…" />
    </div>
  );
}

export function GenericPageSkeleton({ label = "Loading…" }: { label?: string }) {
  return (
    <SkeletonRegion label={label}>
      <PageTitleSkeleton />
      <StatCardsSkeleton count={3} className="mb-6 grid gap-4 sm:grid-cols-3" />
      <PanelSkeleton action={false}><ListSkeleton rows={3} card={false} /></PanelSkeleton>
    </SkeletonRegion>
  );
}

/** Picks the investor page skeleton for the current route, so the placeholder matches what will render. */
export function InvestorRouteSkeleton() {
  const path = usePathname() ?? "";
  if (path.startsWith("/investor/dashboard")) return <DashboardSkeleton />;
  if (/^\/investor\/portfolio\/[^/]+$/.test(path)) return <InvestmentDetailSkeleton />;
  if (path.startsWith("/investor/portfolio")) return <PortfolioSkeleton />;
  if (path.startsWith("/investor/profile")) return <ProfileSkeleton />;
  if (path.startsWith("/investor/notifications")) return <NotificationsSkeleton />;
  if (path.startsWith("/investor/transactions")) return <TransactionsSkeleton />;
  if (path.startsWith("/investor/cash")) return <CashSkeleton />;
  if (path.startsWith("/investor/watchlist")) return <WishlistSkeleton />;
  if (path.startsWith("/investor/support")) return <FormPageSkeleton label="Loading support…" centered />;
  if (path.startsWith("/investor/withdraw")) return <FormPageSkeleton label="Loading withdrawal form…" fields={2} />;
  return <GenericPageSkeleton />;
}

/** Public project detail placeholder (breadcrumb, title, main column + side panel). */
export function ProjectDetailSkeleton() {
  return (
    <SkeletonRegion label="Loading project…" className="mx-auto max-w-6xl px-4 py-8">
      <Skeleton className="mb-4 h-4 w-48" />
      <PageTitleSkeleton actions />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Skeleton className="aspect-[16/9] w-full rounded-card" />
          <TextLinesSkeleton lines={4} />
          <Skeleton className="h-48 w-full rounded-card" />
        </div>
        <div className="space-y-4 rounded-card border border-line bg-white p-5 shadow-card"><DefListSkeleton rows={4} /><Skeleton className="h-3 w-full" /><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /></div>
      </div>
    </SkeletonRegion>
  );
}

/** Public /projects explorer placeholder (project list, centre details, side panel) — same grid as MarketDashboard. */
export function MarketSkeleton() {
  return (
    <SkeletonRegion label="Loading projects…" className="mx-auto max-w-[1600px] px-4 py-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)_360px]">
        <div className="space-y-3 rounded-card border border-line bg-white p-4"><Skeleton className="h-11 w-full" />{range(4).map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        <div className="min-w-0 space-y-4"><Skeleton className="h-11 w-40 rounded-full" /><Skeleton className="h-64 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-64 w-full" /></div>
        <div className="space-y-3 rounded-card border border-line bg-white p-4 md:col-span-2 xl:col-span-1"><Skeleton className="h-6 w-2/3" /><DefListSkeleton rows={4} /><Skeleton className="h-11 w-full" /></div>
      </div>
    </SkeletonRegion>
  );
}

/** Login card + demo credentials box. */
export function LoginSkeleton() {
  return (
    <SkeletonRegion label="Loading log in…" className="mx-auto max-w-md space-y-4 px-4 py-12">
      <div className="space-y-4 rounded-card border border-line bg-white p-5 shadow-card">
        <Skeleton className="h-7 w-24" /><Skeleton className="h-4 w-56" />
        <FieldSkeleton /><FieldSkeleton /><Skeleton className="h-11 w-full" /><Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-24 w-full rounded-card" />
    </SkeletonRegion>
  );
}
