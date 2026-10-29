import { describe, expect, it } from "vitest";
import { MARKET_CATEGORIES, MARKET_PRODUCTS, priceDaysAgo, RANGES, seriesFor } from "@/data/market-products";
import { convertPrice, estimateQuantity, parseTradeAmount, pctChange, scenarioRange, stepAmount, unitsFor } from "@/lib/market-calculations";

const tomato = MARKET_PRODUCTS.find((p) => p.name === "Tomato")!;

describe("unit conversion and quantity", () => {
  it("converts a per-kg price to quintal and tonne", () => {
    expect(convertPrice(40.2, "kg", "kg")).toBeCloseTo(40.2);
    expect(convertPrice(40.2, "kg", "quintal")).toBeCloseTo(4020);
    expect(convertPrice(40.2, "kg", "tonne")).toBeCloseTo(40200);
  });
  it("does not convert litre or piece products to weight units", () => {
    expect(unitsFor("litre")).toEqual(["litre"]);
    expect(convertPrice(56, "litre", "kg")).toBeNaN();
  });
  it("estimates quantity = amount / price", () => {
    expect(estimateQuantity(5000, 40.2, "kg", "kg")!).toBeCloseTo(124.38, 2);
    expect(estimateQuantity(5000, 40.2, "kg", "quintal")!).toBeCloseTo(1.2438, 3);
    expect(estimateQuantity(0, 40.2, "kg", "kg")).toBeNull();
    expect(estimateQuantity(5000, 0, "kg", "kg")).toBeNull();
  });
  it("guards pctChange against bad input", () => {
    expect(pctChange(110, 100)).toBeCloseTo(10);
    expect(pctChange(1, 0)).toBeNull();
    expect(pctChange(NaN, 5)).toBeNull();
  });
});

describe("amount validation", () => {
  it("accepts Indian-formatted amounts in range and rejects the rest", () => {
    expect(parseTradeAmount("5,000")).toEqual({ ok: true, value: 5000 });
    for (const bad of ["", "abc", "-500", "499", "100001", "1e5", "5.123"]) expect(parseTradeAmount(bad).ok).toBe(false);
  });
  it("steps by 500 within bounds", () => {
    expect(stepAmount(5000, 1)).toBe(5500);
    expect(stepAmount(500, -1)).toBe(500);
    expect(stepAmount(100000, 1)).toBe(100000);
  });
  it("scenario range includes a downside", () => {
    const r = scenarioRange(5000);
    expect(r.low).toBeLessThan(5000);
    expect(r.high).toBeGreaterThan(5000);
  });
});

describe("demo market data", () => {
  it("covers every category and keeps stats consistent with the series", () => {
    for (const c of MARKET_CATEGORIES) expect(MARKET_PRODUCTS.some((p) => p.category === c)).toBe(true);
    for (const p of MARKET_PRODUCTS) {
      expect(p.dataSource).toBe("mock");
      expect(p.yearlyLow).toBeLessThanOrEqual(p.price);
      expect(p.yearlyHigh).toBeGreaterThanOrEqual(p.price);
      expect(p.dayLow).toBeLessThanOrEqual(p.dayHigh);
      for (const r of RANGES) expect(seriesFor(p, r).length).toBeGreaterThan(1);
    }
  });
  it("derives performance from history that matches the seeded trend", () => {
    expect(pctChange(tomato.price, priceDaysAgo(tomato, 30)!)).toBeCloseTo(28.4, 0);
    expect(pctChange(tomato.price, priceDaysAgo(tomato, 365)!)).toBeCloseTo(42.1, 0);
    expect(tomato.price - tomato.price / 1.068).toBeCloseTo(2.56, 2);
  });
  it("gives each product its own history", () => {
    const a = seriesFor(MARKET_PRODUCTS[0], "1M").map((p) => p.price).join();
    const b = seriesFor(MARKET_PRODUCTS[1], "1M").map((p) => p.price).join();
    expect(a).not.toBe(b);
  });
});
