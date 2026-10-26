# Assumptions register

The frontend guide says: *if a detail is not defined in the scope, record it here instead of silently inventing a
business rule.* Nothing below is an approved business, legal, or financial rule. All are demo values or UI choices that
a real implementation must replace. Configurable values live in `src/config/demo-config.ts`.

## Pending business decisions (deliberately NOT decided in the UI)

| Topic | What the prototype does | Decision needed |
|---|---|---|
| Legal model (what a payment *is*) | Generic "simulated commitment". No return, yield or distribution is calculated for investors. | Choose pre-purchase / sponsorship / financing / participation / equity |
| Investor outcome | Project surplus is shown as **project** economics only, with an explicit "not an investor return" callout. | Approved contractual formula, fees, loss allocation |
| ₹100 minimum | Accepted as a *test amount* where a project fixture allows (`demoConfig.minAmount`). | Whether ₹100 is legally/economically viable |
| Exit / redemption | Simulated request → review → settlement lifecycle with no guaranteed buyer, price or timing. | Whether exit exists, who buys, pricing, lock-ins |
| Valuation | Seeded sample values + an admin "simulate valuation update" tool. | Approved valuation method and cadence |
| Fees / tax | One illustrative exit fee (0.5%). No investment fee. No tax. | Real fee schedule, tax treatment |
| KYC / eligibility | Checklist statuses only. Nothing is verified. | Provider, required checks, retention |
| Payments / payouts | None. No SDKs, no redirect, no card/bank collection. | Provider, custody/escrow, reconciliation |
| Documents | Labelled placeholders; nothing looks executed. | Real templates, signing, storage |

## UI-level assumptions made

- **Risk label** (Lower / Moderate / Higher) uses a documented demo method (high=2, medium=1, low=0 points from
  owner-listed risks; 3 or more is Higher, 2 is Moderate). It is shown with its method, never as an unexplained score.
  See `RISK_METHOD` in `src/lib/project-helpers.ts`.
- **Scenario ranges** (Downside: -20% yield, -15% price, +10% cost, +5pt loss; Upside: +10% yield, +10% price) are
  illustrative test ranges taken from the scope document's examples, not agricultural truths. Names carry no probability.
- **Partial exit cost basis** is released proportionally to the value exited. A full exit sets value to 0 and status to
  *exited* but keeps the original amount for history.
- **Cash model**: available cash is derived only from a ledger. A withdrawal *reserves* cash on submit;
  rejection/cancel/fail releases it exactly once; "paid" consumes the reserve. Pending exit proceeds are never counted
  as available.
- **Allowed status transitions** are defined once in `src/lib/mock-transitions.ts` (for example a submitted withdrawal
  can go to *under review* or *cancelled*, not directly to *rejected*). Investors may cancel only before approval.
- **Idempotency**: investment and withdrawal creation take a per-visit request id; repeats return the original record.
- **Seed numbers** are fictional and internally consistent (covered by tests). Ananya Rao's demo cash is ₹7,694.
- **Project visibility**: only `approved_demo`, `active_demo`, `completed_demo` projects are public. Owners and admins
  can preview the others.
- **Admin approval** makes a project investable only if it has price evidence; otherwise it stays non-investable with
  a stated reason.
- **Passwords** are never checked or stored; any non-empty password works for a known demo email.
- **Theme**: the "Modern Sage" palette supplied by the client (white page background; primary #2E7D32, hover #1B5E20,
  accent #A7D96C, soft #F5FDF7, card #F0F9F4, border #E8F1EA, headings #1F2D21, text #667085, highlight #FFD88A) is
  mapped onto the tokens in `globals.css` / `design-tokens.ts`. Status colours (warning/error/info) are not in the palette
  and are derived to match.
- **Placeholder artwork** (gradient + icon per category) stands in for project photography.
- **Time zone**: all dates are shown in IST through one formatter (`src/lib/format.ts`).

## Scope-document items not built in this phase

- Side-by-side **project comparison** and a standalone **methodology** page (the V1 scope lists them; the frontend
  guide's route map does not). Scenario comparison within a single project is built.
- "Liquidate everything" review screen (the guide makes this optional); the cash page explains why there is no
  one-click version.
- A charting library: a small typed SVG chart with a range control and a table alternative is used instead.
- Anything server-side (authorization, audit immutability, calculation versioning, document permissions) — by design.

## Tooling decisions

- `cacheComponents` / `partialPrefetching` (enabled by the scaffold) are **off** in `next.config.ts`: the app has no
  server data, and those modes force `<Suspense>` around every `usePathname`/`useSearchParams` consumer for no benefit.
- Next.js 16: route `params` are Promises; client pages read them with `useParams()`.
