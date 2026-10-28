"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Heart, MapPin } from "lucide-react";
import { Badge, LinkButton, ProgressBar, Button } from "@/components/common/ui";
import { ProjectStatusBadge } from "@/components/common/badges";
import { ProjectImage } from "@/components/common/visuals";
import { categoryLabel, durationLabel, STAGE_LABEL } from "@/config/demo-config";
import { fundingProgress } from "@/lib/analysis-calculations";
import { formatINR } from "@/lib/format";
import { analysisCompleteness, COMPLETENESS_LABEL, riskLabel } from "@/lib/project-helpers";
import { cn } from "@/lib/cn";
import type { Project } from "@/types";

export function ProjectCard({ project: p, saved, onToggleSave, layout = "grid", showStatus, viewHref }: { project: Project; saved?: boolean; onToggleSave?: () => void; layout?: "grid" | "list"; showStatus?: boolean; viewHref?: string }) {
  const prog = fundingProgress(p.funding);
  const comp = analysisCompleteness(p);
  const risk = riskLabel(p);
  return (
    <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={cn("group flex overflow-hidden rounded-card border border-line bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-hover", layout === "list" ? "flex-col sm:flex-row" : "flex-col")}>
      <ProjectImage category={p.category} title={p.title} className={layout === "list" ? "h-40 sm:h-auto sm:w-56 sm:shrink-0" : "h-40"} />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{categoryLabel(p.category)}</Badge>
          {showStatus && <ProjectStatusBadge status={p.status} />}
          <Badge tone={comp === "full" ? "ok" : comp === "limited" ? "warn" : "neutral"}>{COMPLETENESS_LABEL[comp]}</Badge>
        </div>
        <div>
          <h3 className="text-lg font-bold leading-snug text-brand-900"><Link href={`/projects/${p.id}`} className="hover:underline">{p.title}</Link></h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted"><MapPin className="size-3.5" aria-hidden /> {p.district ? `${p.district}, ` : ""}{p.location}</p>
        </div>
        <p className="line-clamp-2 text-sm text-muted">{p.summary}</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <li className="flex items-center gap-1"><Calendar className="size-3.5" aria-hidden /> {durationLabel(p.durationMonths)} · {p.season}</li>
          <li>Stage: {STAGE_LABEL[p.stage]}</li>
          <li title="Demo risk label — see methodology on the project page">Risk label (demo): {risk}</li>
        </ul>
        {p.funding && (
          <div>
            <div className="mb-1 flex justify-between text-xs"><span className="tabular font-semibold">{formatINR(p.funding.raised)} of {formatINR(p.funding.target)}</span><span>{prog}% (sample)</span></div>
            <ProgressBar value={prog} label={`Sample funding progress for ${p.title}`} />
          </div>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <LinkButton href={viewHref ?? `/projects/${p.id}`} className="flex-1">View project</LinkButton>
          {onToggleSave && (
            <Button variant="secondary" aria-pressed={saved} aria-label={saved ? `Remove ${p.title} from watchlist` : `Save ${p.title} to watchlist`} onClick={onToggleSave}>
              <Heart className={cn("size-4", saved && "fill-brand-600 text-brand-600")} aria-hidden /> {saved ? "Saved" : "Save"}
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
