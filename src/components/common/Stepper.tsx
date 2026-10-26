import { cn } from "@/lib/cn";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol aria-label="Progress" className="mb-6 flex flex-wrap gap-2">
      {steps.map((s, i) => (
        <li key={s} aria-current={i === current ? "step" : undefined} className={cn("flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold", i === current ? "bg-brand-600 text-white" : i < current ? "bg-brand-100 text-brand-800" : "bg-earth-100 text-muted")}>
          <span aria-hidden className="grid size-5 place-items-center rounded-full bg-white/30 text-[11px]">{i < current ? "✓" : i + 1}</span>
          <span className={cn(i === current ? "" : "hidden sm:inline")}>{s}</span>
          <span className="sr-only">{i < current ? "(complete)" : i === current ? "(current step)" : "(upcoming)"}</span>
        </li>
      ))}
    </ol>
  );
}
