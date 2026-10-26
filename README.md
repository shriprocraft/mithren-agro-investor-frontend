# Organic Agriculture Investment Platform — frontend prototype

Frontend-only prototype (Next.js App Router, TypeScript strict, Tailwind v4, Framer Motion). **No backend, no API
calls, no real money.** Every project, amount, valuation and transaction is fictional demo data held in React Context
and (optionally) `localStorage`.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm test           # vitest: calculations, validation, lifecycle invariants
npm run typecheck && npm run lint
```

## Try it

Open `/login` and use a demo shortcut:

| Shortcut | What to try |
|---|---|
| Investor with portfolio | Dashboard, ₹100 simulated investment (`/projects/p-1` → Simulate), sell/redeem, withdraw, cash ledger |
| Investor, no positions | Empty states, onboarding wizard, verification checklist |
| Project owner | Create/edit/submit a project, milestones, updates |
| Admin | Approve/reject projects, advance exit and withdrawal queues, reconciliation, audit, reports |

The account menu (top right) switches demo role and **resets demo data**. Role switching is a prototype convenience,
not a security boundary.

## Structure

```
src/
  app/          routes: (public) incl. auth, investor/, owner/, admin/
  components/   common/ (ui, tables, dialogs, badges), layout/, analysis/, projects/, owner/, admin/
  config/       design-tokens, demo-config (all demo assumptions), navigation
  context/      DemoContext — shared mock session + state, versioned localStorage
  data/         typed seed data (projects, users, investments, transactions …)
  lib/          pure logic: calculations, validation, transition table, mock-service, formatting
  hooks/        derived investor/owner data
  tests/        vitest suites
docs/ASSUMPTIONS.md   assumptions register and pending decisions
```

**Replaceable by design.** The UI never mutates data directly. Every state change goes through a pure function in
`src/lib/mock-service.ts` — `(state, input) => { ok: true, state, data } | { ok: false, error }`. Swap those bodies for
API calls later; screens and result shapes stay the same. Business maths lives in `analysis-calculations.ts` and
`portfolio-calculations.ts`; allowed status transitions live only in `mock-transitions.ts`.

## Read before extending

See `docs/ASSUMPTIONS.md`. The legal model, investor returns, exit mechanism, valuation method, fees, KYC and payments
are **undecided** and intentionally not implemented as rules.
