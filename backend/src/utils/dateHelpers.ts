/**
 * Shared date utility helpers used across controllers.
 * Eliminates repeated month-boundary and YYYY-MM formatting logic.
 */

/** Format a Date as 'YYYY-MM' string */
export const toYearMonth = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

/** Get the current month as 'YYYY-MM' */
export const getCurrentYearMonth = (): string => toYearMonth(new Date());

/** Get the first moment (00:00:00.000) of a month containing `date` */
export const getStartOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/** Get the last moment (23:59:59) of a month containing `date` */
export const getEndOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
};

/** Get start/end boundaries for a month given a 'YYYY-MM' string */
export const getMonthBoundaries = (yearMonth: string): { startOfMonth: Date; endOfMonth: Date } => {
  const startOfMonth = new Date(`${yearMonth}-01`);
  const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59);
  return { startOfMonth, endOfMonth };
};
