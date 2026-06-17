/**
 * Shared expense category list used across pages and forms.
 * Keep this in sync with the backend constants/categories.ts.
 */
export const EXPENSE_CATEGORIES = [
  'Food',
  'Groceries',
  'Travel',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Bills',
  'Healthcare',
  'Education',
  'Rent',
  'Utilities',
  'Salary',
  'Freelance',
  'Investments',
  'Miscellaneous'
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
