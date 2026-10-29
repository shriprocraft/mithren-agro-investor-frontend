"use client";

import { useState } from "react";
import { Info, Minus, Plus, TriangleAlert } from "lucide-react";
import { Modal } from "@/components/common/feedback";
import { Button } from "@/components/common/ui";
import { MARKET_DATA_LABEL, type MarketProduct } from "@/data/market-products";
import { cn } from "@/lib/cn";
import { formatINR } from "@/lib/format";
import {
  AMOUNT_STEP, convertPrice, DEMO_SCENARIO, estimateQuantity, MAX_AMOUNT, MIN_AMOUNT, parseTradeAmount, scenarioRange, stepAmount, UNIT_SHORT, type PriceUnit,
} from "@/lib/market-calculations";

type Side = "buy" | "sell";
type Kind = "once" | "monthly";
const qtyFmt = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: n < 1 ? 4 : 2 });
const priceFmt = (n: number) => formatINR(Number.isInteger(n) ? n : Math.round(n * 100) / 100);

export function TradePanel({ product, unit }: { product: MarketProduct; unit: PriceUnit }) {
  const [side, setSide] = useState<Side>("buy");
  const [kind, setKind] = useState<Kind>("once");
  const [raw, setRaw] = useState("5,000");
  const [amount, setAmount] = useState(5000);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState(false);

  const parsed = parseTradeAmount(raw);
  const valid = parsed.ok;
  const unitPrice = convertPrice(product.price, product.unit, unit);
  const qty = valid ? estimateQuantity(parsed.value, product.price, product.unit, unit) : null;
  const scenario = valid ? scenarioRange(parsed.value) : null;

  const onType = (v: string) => {
    setRaw(v);
    const p = parseTradeAmount(v);
    if (p.ok) { setAmount(p.value); setError(null); } else setError(p.error);
  };
  const setValue = (n: number) => { setAmount(n); setRaw(n.toLocaleString("en-IN")); setError(null); };
  const bump = (dir: 1 | -1) => setValue(stepAmount(valid ? parsed.value : amount, dir));

  const buy = side === "buy";
  const seg = (on: boolean) => cn("min-h-11 rounded-control px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2", on ? "bg-brand-600 text-white shadow-sm" : "bg-earth-100 text-ink hover:bg-brand-50");

  return (
    <section aria-label="Buy or sell" className="space-y-5 rounded-card border border-line bg-white p-5 shadow-card">
      <div role="tablist" aria-label="Order side" className="grid grid-cols-2 gap-2">
        {(["buy", "sell"] as Side[]).map((s) => <button key={s} role="tab" aria-selected={side === s} type="button" onClick={() => setSide(s)} className={seg(side === s)}>{s === "buy" ? "Buy" : "Sell"}</button>)}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Investment Type</p>
        <div role="radiogroup" aria-label="Investment type" className="grid grid-cols-3 gap-2">
          <button type="button" role="radio" aria-checked={kind === "once"} onClick={() => setKind("once")} className={cn("min-h-11 rounded-control border px-2 text-xs font-semibold", kind === "once" ? "border-brand-600 bg-brand-50 text-brand-800" : "border-line hover:bg-brand-50")}>One-time</button>
          <button type="button" role="radio" aria-checked={kind === "monthly"} onClick={() => setKind("monthly")} className={cn("min-h-11 rounded-control border px-2 text-xs font-semibold", kind === "monthly" ? "border-brand-600 bg-brand-50 text-brand-800" : "border-line hover:bg-brand-50")}>Monthly Plan</button>
          <button type="button" role="radio" aria-checked={false} disabled className="min-h-11 rounded-control border border-line px-1 text-xs font-semibold text-muted opacity-70">SIP <span className="block font-normal">Coming Soon</span></button>
        </div>
        {kind === "monthly" && <p className="mt-2 text-xs text-muted">Monthly Plan: {valid ? formatINR(parsed.value) : "your amount"} each month, for review only. No recurring payment is created in this prototype.</p>}
      </div>

      <div>
        <label htmlFor="trade-amount" className="mb-2 block text-sm font-semibold text-ink">{buy ? "Investment Amount (₹)" : "Sale Value (₹)"}{kind === "monthly" ? " per month" : ""}</label>
        <div className="flex gap-2">
          <div className={cn("flex min-h-12 min-w-0 flex-1 items-center gap-1 rounded-control border bg-white px-3 focus-within:outline-2 focus-within:outline-brand-600", error ? "border-bad-fg" : "border-line")}>
            <span aria-hidden className="text-lg font-semibold">₹</span>
            <input id="trade-amount" inputMode="decimal" value={raw} onChange={(e) => onType(e.target.value)} onBlur={() => { const p = parseTradeAmount(raw); if (p.ok) setRaw(p.value.toLocaleString("en-IN")); }}
              aria-invalid={!!error} aria-describedby={error ? "trade-amount-err" : undefined} className="min-w-0 flex-1 bg-transparent text-xl font-bold outline-none" />
          </div>
          <button type="button" aria-label={`Decrease amount by ${AMOUNT_STEP}`} onClick={() => bump(-1)} className="grid size-12 place-items-center rounded-control border border-line hover:bg-brand-50"><Minus className="size-4" aria-hidden /></button>
          <button type="button" aria-label={`Increase amount by ${AMOUNT_STEP}`} onClick={() => bump(1)} className="grid size-12 place-items-center rounded-control border border-line hover:bg-brand-50"><Plus className="size-4" aria-hidden /></button>
        </div>
        {error && <p id="trade-amount-err" role="alert" className="mt-1 text-xs font-medium text-bad-fg">{error}</p>}
        <input type="range" aria-label="Amount slider" min={MIN_AMOUNT} max={MAX_AMOUNT} step={AMOUNT_STEP} value={Math.min(MAX_AMOUNT, Math.max(MIN_AMOUNT, valid ? parsed.value : amount))} onChange={(e) => setValue(Number(e.target.value))} className="mt-3 w-full accent-brand-600" />
        <div className="flex justify-between text-xs text-muted"><span>{formatINR(MIN_AMOUNT)}</span><span>{formatINR(MAX_AMOUNT).replace(/(\d+),(\d{3})$/, "$1,$2")}</span></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0 rounded-control border border-line p-3">
          <p className="text-xs text-muted">{buy ? "Estimated Quantity" : "Quantity to Sell (approx.)"}</p>
          <p className="tabular mt-1 truncate text-lg font-bold" data-testid="est-qty">{qty === null ? "—" : `${qtyFmt(qty)} ${UNIT_SHORT[unit]}`}</p>
        </div>
        <div className="min-w-0 rounded-control border border-line p-3">
          <p className="text-xs text-muted">Current Price</p>
          <p className="tabular mt-1 truncate text-lg font-bold" data-testid="unit-price">{priceFmt(unitPrice)}/{UNIT_SHORT[unit]}</p>
        </div>
      </div>
      <p className="-mt-2 text-xs text-muted">{buy ? "Amount ÷ price: how much produce this amount would represent at the demo price." : "Sale value ÷ price: the quantity this value would represent at the demo price."} Nothing is bought or sold by changing these values.</p>

      <div className="rounded-control bg-brand-50 p-3">
        <p className="text-xs font-semibold text-brand-800">Illustrative Value Scenario</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div className="min-w-0"><p className="text-xs text-muted">Value range</p><p className="tabular text-base font-bold">{scenario ? `${formatINR(Math.round(scenario.low))} – ${formatINR(Math.round(scenario.high))}` : "—"}</p></div>
          <div><p className="text-xs text-muted">Illustrative change</p><p className="tabular text-base font-bold">{DEMO_SCENARIO.lowPct}% to +{DEMO_SCENARIO.highPct}%</p></div>
        </div>
        <p className="mt-2 text-[11px] text-muted">Demo assumption only: price moves between {DEMO_SCENARIO.lowPct}% and +{DEMO_SCENARIO.highPct}%. Not a forecast. Prices may rise or fall; returns are not guaranteed.</p>
      </div>

      <Button className="w-full min-h-12 text-base" disabled={!valid} onClick={() => setReview(true)}>
        {buy ? `Buy ${product.buyLabel}` : "Review Sell Order"} →
      </Button>

      <div className="flex gap-2 rounded-control border border-warn-fg/30 bg-warn-bg p-3 text-xs text-warn-fg"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /><p>Prices are market-driven and may fluctuate. Please review all terms, risks and fees before investing. {MARKET_DATA_LABEL}.</p></div>

      <Modal open={review} onClose={() => setReview(false)} title={buy ? "Review buy order (demo)" : "Review sell order (demo)"}>
        {valid && qty !== null && (
          <div className="space-y-3 text-sm">
            <dl className="divide-y divide-line rounded-control border border-line">
              {[["Product", product.name], ["Side", buy ? "Buy" : "Sell"], ["Plan", kind === "once" ? "One-time" : "Monthly Plan (review only)"], ["Amount", formatINR(parsed.value)], ["Unit price", `${priceFmt(unitPrice)}/${UNIT_SHORT[unit]}`], ["Estimated quantity", `${qtyFmt(qty)} ${UNIT_SHORT[unit]}`]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 px-3 py-2"><dt className="text-muted">{k}</dt><dd className="tabular font-semibold">{v}</dd></div>
              ))}
            </dl>
            <p className="flex gap-2 rounded-control bg-info-bg p-3 text-xs text-info-fg"><Info className="mt-0.5 size-4 shrink-0" aria-hidden /><span>This is a demonstration review only. No order has been placed, no money moves and nothing is recorded. Prices are illustrative and may differ from any real market price.</span></p>
            <div className="flex justify-end"><Button variant="secondary" onClick={() => setReview(false)}>Close</Button></div>
          </div>
        )}
      </Modal>
    </section>
  );
}
