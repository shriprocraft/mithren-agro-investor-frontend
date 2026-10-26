"use client";

import { useParams } from "next/navigation";
import { Breadcrumbs, EmptyState, LinkButton, PageTitle } from "@/components/common/ui";
import { ProjectForm } from "@/components/owner/ProjectForm";
import { useDemo } from "@/context/DemoContext";
import { projectById } from "@/lib/project-helpers";

export default function EditProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { state, user } = useDemo();
  const p = projectById(state, projectId);
  if (!p || p.ownerId !== user?.id) return <EmptyState title="Project not found" body="It may belong to another owner." action={<LinkButton href="/owner/projects">My projects</LinkButton>} />;
  if (!["draft", "changes_requested"].includes(p.status)) {
    return <EmptyState title="This project can’t be edited right now" body={`Status is “${p.status.replace(/_/g, " ")}”. Only drafts and projects with requested changes are editable.`} action={<LinkButton href={`/owner/projects/${p.id}`}>View project</LinkButton>} />;
  }
  return (
    <>
      <Breadcrumbs items={[{ label: "My projects", href: "/owner/projects" }, { label: p.title, href: `/owner/projects/${p.id}` }, { label: "Edit" }]} />
      <PageTitle title="Edit project" subtitle={p.title} />
      <ProjectForm key={p.id} existing={p} />
    </>
  );
}
