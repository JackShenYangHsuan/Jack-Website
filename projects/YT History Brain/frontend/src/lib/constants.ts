/**
 * Centralized category color definitions.
 * Single source of truth for all category-related colors across the app.
 */

// Base color definitions - maps category to Tailwind color name
const CATEGORY_BASE_COLORS: Record<string, string> = {
  Technology: "blue",
  Programming: "purple",
  "AI/ML": "cyan",
  Business: "amber",
  Finance: "green",
  Productivity: "orange",
  "Self-Improvement": "pink",
  "Health/Fitness": "red",
  Entertainment: "violet",
  Education: "indigo",
  News: "slate",
  Science: "teal",
  Design: "rose",
  Marketing: "lime",
  Career: "sky",
  Lifestyle: "fuchsia",
  Gaming: "emerald",
  Music: "yellow",
  Travel: "cyan",
  Food: "orange",
  Sports: "green",
  Other: "gray",
};

// Tailwind color to hex mapping (500 shade)
const TAILWIND_HEX_MAP: Record<string, string> = {
  blue: "#3b82f6",
  purple: "#a855f7",
  cyan: "#06b6d4",
  amber: "#f59e0b",
  green: "#22c55e",
  orange: "#f97316",
  pink: "#ec4899",
  red: "#ef4444",
  violet: "#8b5cf6",
  indigo: "#6366f1",
  slate: "#64748b",
  teal: "#14b8a6",
  rose: "#f43f5e",
  lime: "#84cc16",
  sky: "#0ea5e9",
  fuchsia: "#d946ef",
  emerald: "#10b981",
  yellow: "#eab308",
  gray: "#6b7280",
};

/**
 * Get Tailwind classes for a category badge/chip.
 * Returns background, text, and border classes.
 */
export function getCategoryTailwindClasses(category: string): string {
  const baseColor = CATEGORY_BASE_COLORS[category] || CATEGORY_BASE_COLORS.Other;
  return `bg-${baseColor}-500/20 text-${baseColor}-400 border-${baseColor}-500/30`;
}

/**
 * Get hex color for a category (used in canvas rendering).
 */
export function getCategoryHexColor(category: string): string {
  const baseColor = CATEGORY_BASE_COLORS[category] || CATEGORY_BASE_COLORS.Other;
  return TAILWIND_HEX_MAP[baseColor] || TAILWIND_HEX_MAP.gray;
}

/**
 * Get hex color from array of categories (uses first category).
 */
export function getCategoryHexColorFromArray(categories: string[]): string {
  if (categories.length === 0) return TAILWIND_HEX_MAP.gray;
  return getCategoryHexColor(categories[0]);
}

/**
 * Pre-computed category colors object for components that need
 * to iterate over all categories.
 */
export const CATEGORY_COLORS_TAILWIND: Record<string, string> = Object.fromEntries(
  Object.keys(CATEGORY_BASE_COLORS).map((cat) => [cat, getCategoryTailwindClasses(cat)])
);

export const CATEGORY_COLORS_HEX: Record<string, string> = Object.fromEntries(
  Object.keys(CATEGORY_BASE_COLORS).map((cat) => [cat, getCategoryHexColor(cat)])
);

/**
 * List of all available categories.
 */
export const ALL_CATEGORIES = Object.keys(CATEGORY_BASE_COLORS);
