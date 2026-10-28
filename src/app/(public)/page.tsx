"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileSearch, LineChart, Search, Wallet } from "lucide-react";
import { Callout, LinkButton, Card } from "@/components/common/ui";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { CATEGORIES, COPY } from "@/config/demo-config";
import { useDemo } from "@/context/DemoContext";
import { publishedProjects } from "@/lib/project-helpers";
import { faqs } from "@/content/faq";

const STEPS = [
  { icon: Search, title: "Explore", body: "Browse fictional agriculture projects and filter by crop, region, stage and duration." },
  { icon: FileSearch, title: "Understand", body: "Read production, cost and market assumptions with their source and evidence label." },
  { icon: LineChart, title: "Test scenarios", body: "Compare downside, base and upside cases and adjust inputs to see what could go wrong." },
  { icon: Wallet, title: "Simulate & track", body: "Walk through a simulated ₹100 commitment, then follow the demo portfolio, exits and withdrawals." },
];

export default function HomePage() {
  const { state } = useDemo();
  const featured = publishedProjects(state).filter((p) => p.featured);
  const published = publishedProjects(state);
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-5 md:py-20">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-3">
            <p className="mb-3 inline-block rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700">Frontend prototype · sample data</p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-brand-900 sm:text-5xl">See what a farm project produces, costs and risks — before you commit.</h1>
            <p className="mt-4 max-w-xl text-lg text-muted">An interactive prototype of an organic agriculture investment platform. Explore evidence-labelled project analysis and rehearse the full journey with simulated money.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href="/projects" className="min-h-12 px-6">Browse projects <ArrowRight className="size-4" aria-hidden /></LinkButton>
              <LinkButton href="/how-it-works" variant="secondary" className="min-h-12 px-6">How it works</LinkButton>
            </div>
          </motion.div>
          <Card className="md:col-span-2">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Demo catalogue at a glance <span className="ml-1 rounded bg-neutral-bg px-1.5 py-0.5 text-[11px] text-neutral-fg">SAMPLE</span></h2>
            <dl className="mt-3 grid grid-cols-2 gap-4">
              <div><dt className="text-xs text-muted">Listed projects</dt><dd className="tabular text-3xl font-bold text-brand-900">{published.length}</dd></div>
              <div><dt className="text-xs text-muted">Categories supported</dt><dd className="tabular text-3xl font-bold text-brand-900">{CATEGORIES.length}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-muted">These are counts of fictional demo records, not platform performance claims.</p>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between gap-3">
          <h2 className="text-2xl font-bold text-brand-900">Featured projects</h2>
          <Link href="/projects" className="text-sm font-semibold text-brand-700 hover:underline">View all projects</Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2">{featured.map((p) => <ProjectCard key={p.id} project={p} viewHref={`/projects?project=${encodeURIComponent(p.id)}`} />)}</div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-6 text-2xl font-bold text-brand-900">How the platform works</h2>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-card border border-line bg-earth-50 p-5">
                <span className="grid size-10 place-items-center rounded-full bg-brand-100 text-brand-700"><s.icon className="size-5" aria-hidden /></span>
                <h3 className="mt-3 font-semibold">{i + 1}. {s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-4 text-2xl font-bold text-brand-900">Agriculture categories</h2>
        <ul className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (<li key={c.id}><Link href={`/projects?category=${c.id}`} className="inline-flex min-h-11 items-center rounded-full border border-line bg-white px-4 text-sm font-semibold hover:bg-brand-50">{c.label}</Link></li>))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <Callout tone="neutral" title="Read this before exploring">
          {COPY.noGuarantee} {COPY.projectNotReturn} Exit, redemption and withdrawal are simulations only; a buyer or instant liquidity is never assumed. <Link href="/risk-disclosure" className="font-semibold underline">Read the risk disclosure</Link>.
        </Callout>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-4">
        <h2 className="mb-4 text-2xl font-bold text-brand-900">Common questions</h2>
        <div className="space-y-3">
          {faqs.slice(0, 3).map((f) => (
            <details key={f.q} className="rounded-card border border-line bg-white px-5 py-3"><summary className="min-h-8 cursor-pointer font-semibold">{f.q}</summary><p className="mt-2 text-sm text-muted">{f.a}</p></details>
          ))}
        </div>
        <Link href="/faq" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">See all FAQs</Link>
      </section>
    </>
  );
}
