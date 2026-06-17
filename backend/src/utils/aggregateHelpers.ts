/**
 * Shared MongoDB aggregation helpers.
 * Eliminates repeated aggregate-sum patterns across controllers.
 */
import { Types, PipelineStage } from 'mongoose';
import { Expense } from '../models/Expense';

interface SumFilter {
  userId: Types.ObjectId;
  dateRange?: { start: Date; end: Date };
  category?: string;
  paymentMethod?: string;
  creditCardId?: Types.ObjectId;
}

/**
 * Aggregate total expense amount matching a filter.
 * Returns 0 if no matching documents.
 */
export const sumExpenses = async (filter: SumFilter): Promise<number> => {
  const matchStage: Record<string, unknown> = { userId: filter.userId };

  if (filter.dateRange) {
    matchStage.date = { $gte: filter.dateRange.start, $lte: filter.dateRange.end };
  }
  if (filter.category) {
    matchStage.category = filter.category;
  }
  if (filter.paymentMethod) {
    matchStage.paymentMethod = filter.paymentMethod;
  }
  if (filter.creditCardId) {
    matchStage.creditCardId = filter.creditCardId;
  }

  const pipeline: PipelineStage[] = [
    { $match: matchStage },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ];

  const result = await Expense.aggregate(pipeline);
  return result[0]?.total || 0;
};

/**
 * Calculate spent amount for a budget (category or 'all') in a given month.
 */
export const calculateBudgetSpent = async (
  userId: Types.ObjectId,
  category: string,
  startOfMonth: Date,
  endOfMonth: Date
): Promise<number> => {
  const filter: SumFilter = {
    userId,
    dateRange: { start: startOfMonth, end: endOfMonth }
  };

  if (category !== 'all') {
    filter.category = category;
  }

  return sumExpenses(filter);
};

/**
 * Calculate total credit card balance from expenses.
 */
export const calculateCardBalance = async (
  userId: Types.ObjectId,
  cardId: Types.ObjectId
): Promise<number> => {
  return sumExpenses({
    userId,
    paymentMethod: 'credit_card',
    creditCardId: cardId
  });
};
