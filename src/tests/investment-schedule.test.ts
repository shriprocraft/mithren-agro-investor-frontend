import { describe, expect, it } from "vitest";
import { DEFAULT_FREQUENCY, durationLabel, FREQUENCIES, validateDuration } from "@/lib/investment-schedule";

describe("investment schedule", () => {
  it("offers weekly and monthly, defaulting to monthly", () => {
    expect(FREQUENCIES.map((f) => f.id)).toEqual(["weekly", "monthly"]);
    expect(DEFAULT_FREQUENCY).toBe("monthly");
  });
  it("enforces a 10-week minimum for weekly", () => {
    expect(validateDuration("9", "weekly").ok).toBe(false);
    expect(validateDuration("10", "weekly")).toEqual({ ok: true, value: 10 });
    expect(validateDuration("12", "weekly")).toEqual({ ok: true, value: 12 });
  });
  it("enforces a 6-month minimum for monthly", () => {
    expect(validateDuration("5", "monthly").ok).toBe(false);
    expect(validateDuration("6", "monthly")).toEqual({ ok: true, value: 6 });
    expect(validateDuration("12", "monthly")).toEqual({ ok: true, value: 12 });
  });
  it("accepts only positive whole numbers", () => {
    for (const raw of ["", " ", "0", "-6", "6.5", "1e2", "abc", "6 months"]) expect(validateDuration(raw, "monthly").ok).toBe(false);
  });
  it("labels durations with the right unit", () => {
    expect(durationLabel("weekly", 10)).toBe("10 weeks");
    expect(durationLabel("monthly", 6)).toBe("6 months");
  });
});
