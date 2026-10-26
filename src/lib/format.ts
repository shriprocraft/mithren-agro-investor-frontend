/** Centralised INR / date / percent formatting. One locale and one time-zone policy (IST). */
const TZ = "Asia/Kolkata";

const inrWhole = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const inrFull = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const MISSING = "—";

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Whole rupees when the value is whole, otherwise two decimals. */
export function formatINR(v: number | null | undefined): string {
  if (!isNum(v)) return MISSING;
  return Number.isInteger(v) ? inrWhole.format(v) : inrFull.format(v);
}

/** Signed currency: always shows + or − so losses are never hidden. */
export function formatSignedINR(v: number | null | undefined): string {
  if (!isNum(v)) return MISSING;
  if (v === 0) return formatINR(0);
  return `${v > 0 ? "+" : "−"}${formatINR(Math.abs(v))}`;
}

export function formatPercent(v: number | null | undefined, digits = 1, signed = false): string {
  if (!isNum(v)) return MISSING;
  const s = Math.abs(v).toFixed(digits);
  if (!signed) return `${v < 0 ? "−" : ""}${s}%`;
  if (v === 0) return `${s}%`;
  return `${v > 0 ? "+" : "−"}${s}%`;
}

export function formatNumber(v: number | null | undefined, unit?: string): string {
  if (!isNum(v)) return MISSING;
  const n = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(v);
  return unit ? `${n} ${unit}` : n;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return MISSING;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return MISSING;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: TZ }).format(d);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return MISSING;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return MISSING;
  return `${new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  }).format(d)} IST`;
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return MISSING;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", timeZone: TZ }).format(d);
}
