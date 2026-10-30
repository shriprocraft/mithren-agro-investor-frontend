"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

/** Single-open FAQ accordion: one rounded container, divided rows, chevron on the right. */
export function FaqAccordion({ items, className }: { items: { q: string; a: string }[]; className?: string }) {
  const uid = useId();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className={cn("overflow-hidden rounded-[1.75rem] border border-line bg-white", className)}>
      {items.map((f, i) => {
        const expanded = open === i;
        const btn = `${uid}-q-${i}`;
        const panel = `${uid}-a-${i}`;
        return (
          <div key={f.q} className={cn(i > 0 && "border-t border-line")}>
            <h3>
              <button
                id={btn}
                type="button"
                aria-expanded={expanded}
                aria-controls={panel}
                onClick={() => setOpen(expanded ? null : i)}
                className="flex min-h-[4.25rem] w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-medium text-ink transition-colors hover:bg-brand-50/60 focus-visible:bg-brand-50/60 focus-visible:outline-none sm:px-6 sm:text-lg"
              >
                <span>{f.q}</span>
                <ChevronDown className={cn("size-5 shrink-0 text-ink/70 transition-transform duration-200", expanded && "rotate-180")} strokeWidth={1.75} aria-hidden />
              </button>
            </h3>
            <div id={panel} role="region" aria-labelledby={btn} className={cn("grid transition-[grid-template-rows] duration-200 ease-out", expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
              <div className="overflow-hidden" inert={!expanded}>
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted sm:px-6 sm:text-base">{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
