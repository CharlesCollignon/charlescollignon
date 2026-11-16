/**
 * Publishable figures behind the redrawn MIP diagrams.
 * Measured from the codebase (Nov 2026); no client data, coverage figures,
 * partner names or model metrics.
 */

/** Module count per category (32 in total). Labels: caseStudies.mip.diagram.categories.<key> */
export const mipCategories = [
  { key: "gdp", modules: 3 },
  { key: "consumption", modules: 2 },
  { key: "inflation", modules: 2 },
  { key: "employment", modules: 1 },
  { key: "commodities", modules: 2 },
  { key: "industry", modules: 7 },
  { key: "investment", modules: 2 },
  { key: "trade", modules: 7 },
  { key: "risk", modules: 2 },
  { key: "regimes", modules: 2 },
  { key: "urban", modules: 2 },
] as const;

/** Module code before (33 copied folders) and after (one engine). Approximate, not like-for-like. */
export const mipBeforeAfter = {
  before: { files: 639, lines: 80552 },
  after: { files: 109, lines: 21090 },
} as const;

export const mipViews = [
  "chart",
  "table",
  "regional",
  "tension",
  "heatmap",
  "traffic",
  "city",
  "sites",
] as const;
