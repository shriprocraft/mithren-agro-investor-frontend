/**
 * Design tokens — "Modern Sage" palette (white page, primary #2E7D32, hover #1B5E20, accent #A7D96C,
 * soft #F5FDF7, card #F0F9F4, border #E8F1EA, headings #1F2D21, text #667085, highlight #FFD88A). The CSS source of truth is src/app/globals.css (@theme).
 * This module mirrors only the values JavaScript needs (charts, inline SVG).
 */
export const tokens = {
  color: {
    brand: "#2E7D32",
    brandDark: "#1B5E20",
    accent: "#A7D96C",
    highlight: "#FFD88A",
    brandSoft: "#E3F4E6",
    earth: "#FFFFFF",
    ink: "#1F2D21",
    muted: "#667085",
    line: "#E8F1EA",
    forecast: "#9a6a12",
    actual: "#2E7D32",
    grid: "#E8F1EA",
  },
  radius: { card: "1rem", control: "0.625rem" },
  contentWidth: { page: "72rem", narrow: "40rem" },
  zIndex: { header: 30, drawer: 40, dialog: 50, toast: 60 },
} as const;
