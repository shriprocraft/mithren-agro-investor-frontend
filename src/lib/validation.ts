/** Client-side validation (demo). Real eligibility and limits must be enforced server-side later. */

export type Parsed = { ok: true; value: number } | { ok: false; error: string };

/** Parses a user-typed rupee amount (max 2 decimals). */
export function parseAmount(raw: string): Parsed {
  const s = raw.trim().replace(/,/g, "");
  if (s === "") return { ok: false, error: "Enter an amount." };
  if (!/^-?\d*\.?\d*$/.test(s) || s === "." || s === "-") return { ok: false, error: "Enter numbers only." };
  const n = Number(s);
  if (!Number.isFinite(n)) return { ok: false, error: "Enter a valid amount." };
  if (n < 0) return { ok: false, error: "Amount cannot be negative." };
  if (n === 0) return { ok: false, error: "Amount must be greater than zero." };
  if (/\.\d{3,}$/.test(s)) return { ok: false, error: "Use at most 2 decimal places." };
  return { ok: true, value: Math.round(n * 100) / 100 };
}

export function validateInvestmentAmount(
  raw: string,
  limits: { min: number; max: number; remainingAllocation: number | null },
): Parsed {
  const p = parseAmount(raw);
  if (!p.ok) return p;
  if (p.value < limits.min) return { ok: false, error: `Minimum demo amount for this project is ₹${limits.min}.` };
  if (p.value > limits.max) return { ok: false, error: `Maximum demo amount for this project is ₹${limits.max}.` };
  if (limits.remainingAllocation !== null && p.value > limits.remainingAllocation)
    return { ok: false, error: `Only ₹${limits.remainingAllocation} of demo allocation remains.` };
  return p;
}

export function validateExitAmount(
  raw: string,
  opts: { currentValue: number; allowPartial: boolean; allowFull: boolean; kind: "partial" | "full" },
): Parsed {
  if (opts.kind === "full") {
    if (!opts.allowFull) return { ok: false, error: "Full exit is not enabled for this position." };
    return { ok: true, value: opts.currentValue };
  }
  if (!opts.allowPartial) return { ok: false, error: "Partial exit is not enabled for this position." };
  const p = parseAmount(raw);
  if (!p.ok) return p;
  if (p.value >= opts.currentValue)
    return { ok: false, error: "Partial amount must be less than the current estimated value. Choose full exit instead." };
  return p;
}

export function validateWithdrawalAmount(raw: string, available: number): Parsed {
  const p = parseAmount(raw);
  if (!p.ok) return p;
  if (p.value > available) return { ok: false, error: "Amount exceeds your settled available cash (demo)." };
  return p;
}

/* ---------- Generic field validators ---------- */
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const isPhone = (v: string) => /^(\+91[\s-]?)?[6-9]\d{9}$/.test(v.replace(/\s|-/g, "").replace(/^\+91/, "+91"));
export const isStrongEnough = (v: string) => v.length >= 8;
