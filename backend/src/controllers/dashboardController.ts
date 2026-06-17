import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Expense } from '../models/Expense';
import { CreditCard } from '../models/CreditCard';
import { Goal } from '../models/Goal';
import { Budget } from '../models/Budget';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { getStartOfMonth, getEndOfMonth } from '../utils/dateHelpers';
import { sumExpenses } from '../utils/aggregateHelpers';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const startOfMonth = getStartOfMonth(now);
    const endOfMonth = getEndOfMonth(now);

    const userObjectId = new Types.ObjectId(userId);

    // 1. Total Monthly Expenses
    const monthlyExpenses = await sumExpenses({
      userId: userObjectId,
      dateRange: { start: startOfMonth, end: endOfMonth }
    });

    // 2. Previous Month Expenses for Trend Comparison
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfPrevMonth = getStartOfMonth(prevMonth);
    const endOfPrevMonth = getEndOfMonth(prevMonth);
    const prevMonthlyExpenses = await sumExpenses({
      userId: userObjectId,
      dateRange: { start: startOfPrevMonth, end: endOfPrevMonth }
    });

    // 3. Credit Cards Aggregations (Balances and Limits)
    const cards = await CreditCard.find({ userId: userObjectId });
    let totalCreditLimit = 0;
    let totalCreditBalance = 0;
    cards.forEach(card => {
      totalCreditLimit += card.creditLimit;
      totalCreditBalance += card.currentBalance;
    });

    const creditUtilization = totalCreditLimit > 0 ? (totalCreditBalance / totalCreditLimit) * 100 : 0;

    // 4. Savings Goals Progress
    const goals = await Goal.find({ userId: userObjectId });
    let totalSavingsTarget = 0;
    let totalSavingsCurrent = 0;
    goals.forEach(goal => {
      totalSavingsTarget += goal.targetAmount;
      totalSavingsCurrent += goal.currentAmount;
    });

    // 5. Total Income and Net Worth calculations
    // For premium UX, we mock income at $8,500.00 or base it on total budget and savings rates.
    const monthlyIncome = 8500.00;
    const cashAndBank = 12500.00; // Static bank account balance baseline
    const netWorth = (cashAndBank + totalSavingsCurrent) - totalCreditBalance;
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

    // 6. Category breakdown for chart
    const categoryBreakdown = await Expense.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          value: { $sum: '$amount' }
        }
      },
      {
        $project: {
          name: '$_id',
          value: 1,
          _id: 0
        }
      },
      { $sort: { value: -1 } }
    ]);

    // 7. Spending over time (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const spendingTrends = await Expense.aggregate([
      {
        $match: {
          userId: userObjectId,
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          expenses: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format trends
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedTrends = spendingTrends.map(item => {
      return {
        name: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        expenses: item.expenses,
        income: monthlyIncome // Add monthlyIncome for comparisons
      };
    });

    res.status(200).json({
      success: true,
      stats: {
        totalBalance: cashAndBank - totalCreditBalance,
        monthlyExpenses,
        prevMonthlyExpenses,
        monthlyIncome,
        netWorth,
        savingsRate: Math.max(0, savingsRate),
        creditUtilization,
        totalCreditLimit,
        totalCreditBalance,
        activeGoalsCount: goals.length,
        totalSavingsCurrent,
        totalSavingsTarget
      },
      charts: {
        categoryBreakdown,
        spendingTrends: formattedTrends
      }
    });
  } catch (error) {
    next(error);
  }
};
