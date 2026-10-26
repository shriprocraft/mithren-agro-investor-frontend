import { describe, expect, it } from "vitest";
import { isEmail, isPhone, parseAmount, validateExitAmount, validateInvestmentAmount, validateWithdrawalAmount } from "@/lib/validation";
import { safeNext } from "@/lib/safe-next";
import { toCsv } from "@/lib/csv";

const limits = { min: 100, max: 50000, remainingAllocation: 119000 };
const err = (r: { ok: boolean }) => !r.ok;

describe("parseAmount", () => {
  it.each([["", "empty"], ["  ", "blank"], ["abc", "text"], ["12abc", "mixed"], ["0", "zero"], ["-5", "negative"], ["1.234", "3 decimals"], [".", "dot"], ["1e3", "exponent"]])("rejects %j (%s)", (raw) => {
    expect(err(parseAmount(raw))).toBe(true);
  });
  it("accepts valid amounts incl. commas and 2 decimals", () => {
    expect(parseAmount("100")).toEqual({ ok: true, value: 100 });
    expect(parseAmount("1,250.50")).toEqual({ ok: true, value: 1250.5 });
    expect(parseAmount(" 99.9 ")).toEqual({ ok: true, value: 99.9 });
  });
});

describe("validateInvestmentAmount", () => {
  it("allows the ₹100 test amount when the fixture permits", () => {
    expect(validateInvestmentAmount("100", limits)).toEqual({ ok: true, value: 100 });
  });
  it("rejects below min, above max, and above remaining allocation", () => {
    expect(err(validateInvestmentAmount("99", limits))).toBe(true);
    expect(err(validateInvestmentAmount("50001", limits))).toBe(true);
    expect(err(validateInvestmentAmount("500", { ...limits, remainingAllocation: 400 }))).toBe(true);
  });
  it("treats a null allocation as unlimited", () => {
    expect(validateInvestmentAmount("500", { ...limits, remainingAllocation: null }).ok).toBe(true);
  });
});

describe("validateExitAmount", () => {
  const base = { currentValue: 1000, allowPartial: true, allowFull: true };
  it("full exit equals current value", () => {
    expect(validateExitAmount("", { ...base, kind: "full" })).toEqual({ ok: true, value: 1000 });
  });
  it("partial must be positive and strictly below current value", () => {
    expect(validateExitAmount("400", { ...base, kind: "partial" }).ok).toBe(true);
    expect(err(validateExitAmount("1000", { ...base, kind: "partial" }))).toBe(true);
    expect(err(validateExitAmount("0", { ...base, kind: "partial" }))).toBe(true);
  });
  it("honours fixture flags", () => {
    expect(err(validateExitAmount("10", { ...base, allowPartial: false, kind: "partial" }))).toBe(true);
    expect(err(validateExitAmount("", { ...base, allowFull: false, kind: "full" }))).toBe(true);
  });
});

describe("validateWithdrawalAmount", () => {
  it("is limited to settled available cash", () => {
    expect(validateWithdrawalAmount("7694", 7694).ok).toBe(true);
    expect(err(validateWithdrawalAmount("7694.01", 7694))).toBe(true);
    expect(err(validateWithdrawalAmount("100", 0))).toBe(true);
  });
});

describe("field validators", () => {
  it("email / phone", () => {
    expect(isEmail("a@b.co")).toBe(true);
    expect(isEmail("nope")).toBe(false);
    expect(isPhone("9876543210")).toBe(true);
    expect(isPhone("+91 98765 43210")).toBe(true);
    expect(isPhone("12345")).toBe(false);
  });
});

describe("safeNext (post-login redirect)", () => {
  it("blocks open redirects and cross-role paths", () => {
    expect(safeNext("//evil.com", "investor")).toBe("/investor/dashboard");
    expect(safeNext("https://evil.com", "investor")).toBe("/investor/dashboard");
    expect(safeNext("/admin/users", "investor")).toBe("/investor/dashboard");
    expect(safeNext("/investor/portfolio", "owner")).toBe("/owner/dashboard");
    expect(safeNext(null, "admin")).toBe("/admin/dashboard");
  });
  it("preserves permitted destinations", () => {
    expect(safeNext("/investor/invest/p-1", "investor")).toBe("/investor/invest/p-1");
    expect(safeNext("/projects/p-1", "owner")).toBe("/projects/p-1");
  });
});

describe("csv", () => {
  it("quotes and neutralises formula injection", () => {
    expect(toCsv(["a"], [["=SUM(A1)"], ['he said "hi"'], ["x,y"]])).toBe("a\r\n'=SUM(A1)\r\n\"he said \"\"hi\"\"\"\r\n\"x,y\"");
  });
});
