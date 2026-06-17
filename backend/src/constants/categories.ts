/**
 * Shared category constants used for validation and seeding.
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
