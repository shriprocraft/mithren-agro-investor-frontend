"use client";

import { useMemo } from "react";
import { useDemo } from "@/context/DemoContext";

export function useOwner() {
  const { state, user } = useDemo();
  return useMemo(() => {
    const projects = state.projects.filter((p) => p.ownerId === user?.id);
    const raised = projects.reduce((s, p) => s + (p.funding?.raised ?? 0), 0);
    const target = projects.reduce((s, p) => s + (p.funding?.target ?? 0), 0);
    const milestones = projects
      .flatMap((p) => p.milestones.filter((m) => m.status !== "done").map((m) => ({ ...m, projectId: p.id, project: p.title })))
      .sort((a, b) => a.plannedDate.localeCompare(b.plannedDate));
    return { user, projects, raised, target, milestones };
  }, [state.projects, user]);
}
