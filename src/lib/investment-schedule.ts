/**
 * Contribution schedule chosen on the invest panel: a frequency plus a user-entered duration.
 * Review-only in this prototype — no recurring payment, investment record or return is created from it.
 */
export type Frequency = "weekly" | "monthly";

export const FREQUENCIES: { id: Frequency; label: string; unit: string; units: string; min: number }[] = [
  { id: "weekly", label: "Weekly", unit: "week", units: "weeks", min: 10 },
  { id: "monthly", label: "Monthly", unit: "month", units: "months", min: 6 },
];

export const DEFAULT_FREQUENCY: Frequency = "monthly";

export const frequencyOf = (id: Frequency) => FREQUENCIES.find((f) => f.id === id)!;

export const durationLabel = (id: Frequency, n: number) => { const f = frequencyOf(id); return `${n} ${n === 1 ? f.unit : f.units}`; };

/** Positive whole number of weeks/months, at least the frequency's minimum. */
export function validateDuration(raw: string, id: Frequency): { ok: true; value: number } | { ok: false; error: string } {
  const f = frequencyOf(id);
  const s = raw.trim();
  if (!s) return { ok: false, error: `Enter the number of ${f.units}.` };
  if (!/^\d+$/.test(s)) return { ok: false, error: `Enter a whole number of ${f.units}.` };
  const n = Number(s);
  if (!Number.isSafeInteger(n) || n <= 0) return { ok: false, error: `Enter a whole number of ${f.units}.` };
  if (n < f.min) return { ok: false, error: `Minimum duration for ${f.label.toLowerCase()} contributions is ${f.min} ${f.units}.` };
  return { ok: true, value: n };
}
