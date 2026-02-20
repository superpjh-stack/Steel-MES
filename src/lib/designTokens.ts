/**
 * Shared design tokens — single source of truth for semantic colors.
 * Import from here instead of duplicating colorMap objects across components.
 */
export type SemanticColor = 'green' | 'gray' | 'yellow' | 'red' | 'blue' | 'purple';

/** Badge / pill: background + text (used in StatusBadge, EquipBadge) */
export const BADGE_COLOR: Record<SemanticColor, string> = {
  green:  'bg-green-100 text-green-700',
  gray:   'bg-gray-100 text-gray-600',
  yellow: 'bg-yellow-100 text-yellow-700',
  red:    'bg-red-100 text-red-700',
  blue:   'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
};

/** KPI card: background + border + text (lighter tint, used in KpiCard) */
export const CARD_COLOR: Record<SemanticColor, string> = {
  green:  'bg-green-50 border-green-200 text-green-700',
  gray:   'bg-gray-50 border-gray-200 text-gray-700',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  red:    'bg-red-50 border-red-200 text-red-700',
  blue:   'bg-blue-50 border-blue-200 text-blue-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
};

/**
 * Production progress bar color based on achievement rate.
 * Reusable across dashboard, WorkOrderList, WorkOrderCard.
 */
export function progressBarColor(rate: number): string {
  if (rate >= 90) return 'bg-green-500';
  if (rate >= 50) return 'bg-blue-500';
  return 'bg-gray-400';
}
