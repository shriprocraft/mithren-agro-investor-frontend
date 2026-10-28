import { Bird, Fish, Leaf, Milk, Sprout, Wheat, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDate, formatDateTime } from "@/lib/format";
import { TX_STATUS_LABEL } from "@/config/demo-config";
import type { CategoryId, TxEvent } from "@/types";

const VISUAL: Record<CategoryId, { icon: LucideIcon; bg: string }> = {
  crop_cultivation: { icon: Wheat, bg: "from-brand-100 to-brand-200/60" },
  dairy_farming: { icon: Milk, bg: "from-brand-50 to-brand-100" },
  fish_farming: { icon: Fish, bg: "from-brand-100 to-brand-200/50" },
  poultry_farming: { icon: Bird, bg: "from-brand-100 to-brand-50" },
  biogas_composting: { icon: Sprout, bg: "from-brand-100 to-brand-200/60" },
  agri_forestry: { icon: Leaf, bg: "from-brand-200/70 to-brand-50" },
};

/** Illustrative placeholder (no photography supplied). Always carries alt text. */
export function ProjectImage({ category, title, className }: { category: CategoryId; title: string; className?: string }) {
  const v = VISUAL[category];
  const Icon = v.icon;
  return (
    <div role="img" aria-label={`Illustration for ${title} (placeholder artwork)`} className={cn("relative grid place-items-center overflow-hidden bg-gradient-to-br", v.bg, className)}>
      <Icon className="size-1/3 min-h-10 min-w-10 text-brand-700/70 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.25} aria-hidden />
    </div>
  );
}

export function StatusTimeline({ events }: { events: TxEvent[] }) {
  return (
    <ol className="relative space-y-4 border-l-2 border-line pl-5">
      {events.map((e, i) => (
        <li key={i} className="relative">
          <span aria-hidden className={cn("absolute -left-[27px] top-1 size-3 rounded-full border-2 border-white", i === events.length - 1 ? "bg-brand-600" : "bg-brand-200")} />
          <p className="text-sm font-semibold text-ink">{TX_STATUS_LABEL[e.status]}</p>
          <p className="text-xs text-muted">{formatDateTime(e.at)}</p>
          <p className="mt-0.5 text-sm text-muted">{e.note}</p>
        </li>
      ))}
    </ol>
  );
}

export function MilestoneTimeline({ items }: { items: { id: string; title: string; plannedDate: string; actualDate: string | null; status: string; note?: string }[] }) {
  if (items.length === 0) return <p className="text-sm text-muted">No milestones recorded yet.</p>;
  const label: Record<string, string> = { planned: "Planned", in_progress: "In progress", done: "Done", delayed: "Delayed" };
  return (
    <ol className="space-y-3">
      {items.map((m) => (
        <li key={m.id} className="flex gap-3 rounded-control border border-line bg-earth-50 p-3">
          <span aria-hidden className={cn("mt-1 size-3 shrink-0 rounded-full", m.status === "done" ? "bg-brand-600" : m.status === "in_progress" ? "bg-warn-fg" : m.status === "delayed" ? "bg-bad-fg" : "bg-earth-200")} />
          <div className="min-w-0 text-sm">
            <p className="font-semibold">{m.title} <span className="ml-1 font-normal text-muted">· {label[m.status] ?? m.status}</span></p>
            <p className="text-xs text-muted">Planned {formatDate(m.plannedDate)}{m.actualDate ? ` · Actual ${formatDate(m.actualDate)}` : ""}</p>
            {m.note && <p className="mt-1 text-xs text-muted">{m.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
