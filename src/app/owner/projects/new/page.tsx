"use client";

import { Breadcrumbs, PageTitle } from "@/components/common/ui";
import { ProjectForm } from "@/components/owner/ProjectForm";

export default function NewProjectPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "My projects", href: "/owner/projects" }, { label: "New project" }]} />
      <PageTitle title="New project" subtitle="Drafts are saved locally in your browser. Nothing is published until an admin approves it." />
      <ProjectForm />
    </>
  );
}
