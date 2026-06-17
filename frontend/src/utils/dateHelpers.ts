/**
 * Shared date utility helpers for the frontend.
 * Mirrors backend date logic to keep month formatting consistent.
 */

/** Format a Date as 'YYYY-MM' string */
export const toYearMonth = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

/** Get the current month as 'YYYY-MM' */
export const getCurrentYearMonth = (): string => toYearMonth(new Date());
