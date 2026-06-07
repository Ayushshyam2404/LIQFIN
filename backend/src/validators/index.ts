import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  avatar: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required')
});

export const expenseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.number().positive('Amount must be greater than zero'),
  category: z.string().min(1, 'Category is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  creditCardId: z.string().nullable().optional(),
  date: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
  receipt: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const creditCardSchema = z.object({
  cardName: z.string().min(1, 'Card name is required'),
  bank: z.string().min(1, 'Bank is required'),
  creditLimit: z.number().positive('Credit limit must be greater than zero'),
  currentBalance: z.number().nonnegative('Current balance cannot be negative').optional(),
  statementDate: z.number().min(1).max(31, 'Statement date must be between 1 and 31'),
  dueDate: z.number().min(1).max(31, 'Due date must be between 1 and 31'),
  minimumPayment: z.number().nonnegative('Minimum payment cannot be negative').optional(),
  annualFee: z.number().nonnegative('Annual fee cannot be negative').optional(),
  rewardsNotes: z.string().optional(),
  colorTheme: z.string().optional(),
  cardNumberLastFour: z.string().optional()
});

export const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  limit: z.number().positive('Limit must be greater than zero'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format')
});

export const goalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  targetAmount: z.number().positive('Target amount must be greater than zero'),
  currentAmount: z.number().nonnegative('Current amount cannot be negative').optional(),
  category: z.string().optional(),
  deadline: z.string().or(z.date())
});

export const recurringSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.number().positive('Amount must be greater than zero'),
  category: z.string().min(1, 'Category is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  creditCardId: z.string().nullable().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  startDate: z.string().or(z.date()).optional(),
  notes: z.string().optional()
});
