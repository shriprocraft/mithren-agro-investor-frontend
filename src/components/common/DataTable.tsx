"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { Button, EmptyState } from "./ui";
import { cn } from "@/lib/cn";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** value used for sorting; omit to disable sort */
  sort?: (row: T) => string | number;
  className?: string;
};

export function SearchInput({ value, onChange, placeholder = "Search…", label = "Search" }: { value: string; onChange: (v: string) => void; placeholder?: string; label?: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-control border border-line bg-white pl-9 pr-3 text-sm placeholder:text-muted/70"
      />
    </div>
  );
}

export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3 text-sm">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
      <span aria-live="polite">Page {page} of {pages}</span>
      <Button variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
    </nav>
  );
}

/**
 * Responsive table: a real <table> from sm up, stacked cards below.
 * Search is a simple text match against `searchText`.
 */
export function DataTable<T>({
  rows, columns, rowKey, searchText, filters, pageSize = 8, initialQuery = "", emptyTitle = "Nothing to show", emptyBody, caption,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (r: T) => string;
  searchText?: (r: T) => string;
  filters?: (node: { query: string }) => ReactNode;
  pageSize?: number;
  initialQuery?: string;
  emptyTitle?: string;
  emptyBody?: ReactNode;
  caption: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [asc, setAsc] = useState(true);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = q && searchText ? rows.filter((r) => searchText(r).toLowerCase().includes(q)) : rows;
    const col = columns.find((c) => c.key === sortKey);
    if (col?.sort) {
      const f = col.sort;
      out = [...out].sort((a, b) => {
        const x = f(a), y = f(b);
        return (x < y ? -1 : x > y ? 1 : 0) * (asc ? 1 : -1);
      });
    }
    return out;
  }, [rows, query, searchText, sortKey, asc, columns]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const cur = Math.min(page, pages);
  const slice = filtered.slice((cur - 1) * pageSize, cur * pageSize);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        {searchText && (
          <div className="min-w-56 flex-1">
            <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} />
          </div>
        )}
        {filters?.({ query })}
      </div>
      <p className="mb-2 text-xs text-muted" aria-live="polite">{filtered.length} result{filtered.length === 1 ? "" : "s"}</p>
      {slice.length === 0 ? (
        <EmptyState title={emptyTitle} body={emptyBody ?? (query ? "Try a different search." : undefined)} action={query ? <Button variant="secondary" onClick={() => setQuery("")}>Clear search</Button> : undefined} />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-card border border-line bg-white shadow-card sm:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{caption}</caption>
              <thead className="border-b border-line bg-white text-xs uppercase tracking-wide text-muted">
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} scope="col" className={cn("px-4 py-3 font-semibold", c.className)} aria-sort={sortKey === c.key ? (asc ? "ascending" : "descending") : undefined}>
                      {c.sort ? (
                        <button type="button" className="inline-flex items-center gap-1 uppercase hover:text-ink" onClick={() => { if (sortKey === c.key) setAsc(!asc); else { setSortKey(c.key); setAsc(true); } }}>
                          {c.header}
                          {sortKey === c.key && (asc ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />)}
                        </button>
                      ) : c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {slice.map((r) => (
                  <tr key={rowKey(r)} className="transition-colors hover:bg-brand-50">
                    {columns.map((c) => <td key={c.key} className={cn("px-4 py-3 align-top", c.className)}>{c.cell(r)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-3 sm:hidden">
            {slice.map((r) => (
              <li key={rowKey(r)} className="rounded-card border border-line bg-white p-4 shadow-card">
                <dl className="space-y-2">
                  {columns.map((c) => (
                    <div key={c.key} className="flex items-start justify-between gap-3 text-sm">
                      <dt className="text-xs font-semibold uppercase text-muted">{c.header}</dt>
                      <dd className="min-w-0 text-right">{c.cell(r)}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
      <Pagination page={cur} pages={pages} onPage={setPage} />
    </div>
  );
}
