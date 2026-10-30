"use client";

import Link from "next/link";
import { useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronRight, Info, TriangleAlert, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

/* ---------- Buttons ---------- */
type Variant = "primary" | "secondary" | "ghost" | "danger";
const VARIANT: Record<Variant, string> = {
  primary: "bg-brand-600 text-white shadow-sm hover:-translate-y-px hover:bg-brand-700 hover:shadow-hover disabled:translate-y-0 disabled:bg-brand-600/40 disabled:shadow-none",
  secondary: "bg-white text-brand-800 border border-line hover:-translate-y-px hover:border-brand-200 hover:bg-brand-50 hover:shadow-card disabled:translate-y-0 disabled:text-muted/60",
  ghost: "text-brand-800 hover:bg-brand-100 disabled:text-muted/60",
  danger: "bg-bad-fg text-white shadow-sm hover:-translate-y-px hover:bg-[#751f15] hover:shadow-hover disabled:translate-y-0 disabled:bg-bad-fg/40",
};
const base = "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 text-sm font-semibold active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed";

export function Button({ variant = "primary", loading, className, children, disabled, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button type="button" {...rest} disabled={disabled || loading} aria-busy={loading || undefined} className={cn(base, VARIANT[variant], className)}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function LinkButton({ href, variant = "primary", className, children, ...rest }: { href: string; variant?: Variant; className?: string; children: ReactNode } & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link href={href} {...rest} className={cn(base, VARIANT[variant], className)}>
      {children}
    </Link>
  );
}

/* ---------- Surfaces ---------- */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-card border border-line bg-white p-5 shadow-card transition-all duration-200 hover:border-brand-200 hover:bg-card hover:shadow-hover", className)}>{children}</div>;
}

export type Tone = "ok" | "warn" | "bad" | "info" | "neutral";
const TONE: Record<Tone, string> = {
  ok: "bg-ok-bg text-ok-fg",
  warn: "bg-warn-bg text-warn-fg",
  bad: "bg-bad-bg text-bad-fg",
  info: "bg-info-bg text-info-fg",
  neutral: "bg-neutral-bg text-neutral-fg",
};
const TONE_MARK: Record<Tone, string> = { ok: "✓", warn: "◔", bad: "✕", info: "i", neutral: "•" };

/** Badge never relies on colour alone: a text mark is always rendered. */
export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", TONE[tone], className)}>
      <span aria-hidden className="text-[10px] leading-none">{TONE_MARK[tone]}</span>
      {children}
    </span>
  );
}

export function Callout({ tone = "info", title, children, className }: { tone?: Tone; title?: string; children: ReactNode; className?: string }) {
  const Icon = tone === "warn" || tone === "bad" ? TriangleAlert : Info;
  return (
    <div role="note" className={cn("flex gap-3 rounded-card border border-line p-4 text-sm", TONE[tone], className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? "mt-1" : ""}>{children}</div>
      </div>
    </div>
  );
}

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">{title}</h1>
        {subtitle && <div className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            {it.href ? <Link href={it.href} className="underline-offset-2 hover:underline">{it.label}</Link> : <span aria-current="page" className="font-medium text-ink">{it.label}</span>}
            {i < items.length - 1 && <ChevronRight className="size-3.5" aria-hidden />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function StatCard({ label, value, note, tone }: { label: string; value: ReactNode; note?: ReactNode; tone?: "default" | "pending" }) {
  return (
    <div className={cn("rounded-card border bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:bg-card hover:shadow-hover", tone === "pending" ? "border-dashed border-warn-fg/40" : "border-line")}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="tabular mt-1 text-2xl font-bold text-brand-900">{value}</p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number | null; label: string }) {
  if (value === null) return <p className="text-xs text-muted">Funding information not available</p>;
  return (
    <div>
      <div role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-earth-200">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/* ---------- States ---------- */
export function EmptyState({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-line bg-white/60 px-6 py-10 text-center">
      <p className="text-base font-semibold text-brand-900">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-md text-sm text-muted">{body}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", body, onRetry }: { title?: string; body?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-card border border-bad-fg/30 bg-bad-bg px-6 py-8 text-center text-bad-fg">
      <p className="font-semibold">{title}</p>
      {body && <p className="mt-1 text-sm">{body}</p>}
      {onRetry && <div className="mt-4 flex justify-center"><Button variant="secondary" onClick={onRetry}>Try again</Button></div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-control", className)} />;
}

export function LoadingPage({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-5xl space-y-4 p-6">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

/* ---------- Form fields ---------- */
type FieldShell = { label: string; error?: string; hint?: string; required?: boolean };
const inputCls = "min-h-11 w-full rounded-control border border-line bg-white px-3 text-sm text-ink placeholder:text-muted/70 focus-visible:border-brand-500 aria-[invalid=true]:border-bad-fg";

function Shell({ id, label, error, hint, required, children }: FieldShell & { id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-ink">
        {label}
        {required && <span className="text-bad-fg" aria-hidden> *</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-xs font-medium text-bad-fg">{error}</p>}
    </div>
  );
}
const describe = (id: string, error?: string, hint?: string) => (error ? `${id}-err` : hint ? `${id}-hint` : undefined);

export function TextField({ label, error, hint, required, className, ...rest }: FieldShell & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint} required={required}>
      <input id={id} aria-invalid={!!error} aria-describedby={describe(id, error, hint)} aria-required={required} {...rest} className={cn(inputCls, className)} />
    </Shell>
  );
}

export function SelectField({ label, error, hint, required, children, ...rest }: FieldShell & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint} required={required}>
      <select id={id} aria-invalid={!!error} aria-describedby={describe(id, error, hint)} {...rest} className={inputCls}>{children}</select>
    </Shell>
  );
}

export function TextAreaField({ label, error, hint, required, ...rest }: FieldShell & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint} required={required}>
      <textarea id={id} rows={4} aria-invalid={!!error} aria-describedby={describe(id, error, hint)} {...rest} className={cn(inputCls, "py-2")} />
    </Shell>
  );
}

export function CheckField({ label, error, checked, onChange, children }: { label?: string; error?: string; checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  const id = useId();
  return (
    <div>
      <div className="flex items-start gap-3">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className="size-5 shrink-0 accent-brand-600" />
        <label htmlFor={id} className="text-sm text-ink">{label ?? children}</label>
      </div>
      {error && <p id={`${id}-err`} role="alert" className="mt-1 pl-8 text-xs font-medium text-bad-fg">{error}</p>}
    </div>
  );
}

/* ---------- Tabs (WAI-ARIA, arrow-key navigable) ---------- */
export function Tabs({ tabs, initial }: { tabs: { id: string; label: string; content: ReactNode }[]; initial?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id);
  const uid = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const move = (dir: 1 | -1) => {
    const i = tabs.findIndex((t) => t.id === active);
    const next = tabs[(i + dir + tabs.length) % tabs.length];
    setActive(next.id);
    refs.current[next.id]?.focus();
  };
  return (
    <div>
      <div role="tablist" aria-label="Sections" className="flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            ref={(el) => { refs.current[t.id] = el; }}
            role="tab"
            id={`${uid}-tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`${uid}-panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => setActive(t.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
              if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
            }}
            className={cn("min-h-11 whitespace-nowrap border-b-2 px-4 text-sm font-semibold", active === t.id ? "border-brand-600 text-brand-800" : "border-transparent text-muted hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700")}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`${uid}-panel-${t.id}`} aria-labelledby={`${uid}-tab-${t.id}`} hidden={active !== t.id} className="pt-5">
          {active === t.id && t.content}
        </div>
      ))}
    </div>
  );
}

/** Expand/collapse section (native details for keyboard + a11y). */
export function Section({ title, children, defaultOpen = true, badge }: { title: string; children: ReactNode; defaultOpen?: boolean; badge?: ReactNode }) {
  return (
    <details open={defaultOpen} className="group rounded-card border border-line bg-white shadow-card transition-shadow duration-200 hover:border-brand-200 hover:shadow-hover">
      <summary className="flex min-h-12 cursor-pointer list-none flex-wrap items-center justify-between gap-x-3 gap-y-1 px-5 py-3 rounded-card text-base font-semibold text-brand-900 hover:bg-brand-50 [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <span className="flex items-center gap-2">{badge}<ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden /></span>
      </summary>
      <div className="border-t border-line px-5 py-4">{children}</div>
    </details>
  );
}

export function DefList({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</dt>
          <dd className="tabular mt-0.5 text-sm text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
