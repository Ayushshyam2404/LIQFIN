import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Budget } from '../models/Budget';
import { budgetSchema } from '../validators';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { getCurrentYearMonth, getMonthBoundaries } from '../utils/dateHelpers';
import { calculateBudgetSpent } from '../utils/aggregateHelpers';

export const createOrUpdateBudget = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = budgetSchema.parse(req.body);
    const userId = req.user!.id;

    const { startOfMonth, endOfMonth } = getMonthBoundaries(validated.month);
    const currentSpent = await calculateBudgetSpent(
      new Types.ObjectId(userId),
      validated.category,
      startOfMonth,
      endOfMonth
    );

    // Find and update, or create new budget
    const budget = await Budget.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        category: validated.category,
        month: validated.month
      },
      {
        $set: {
          limit: validated.limit,
          spent: currentSpent
        }
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, budget });
  } catch (error) {
    next(error);
  }
};

export const getBudgets = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { month } = req.query;

    const targetMonth = month ? month.toString() : getCurrentYearMonth();

    const budgets = await Budget.find({
      userId: new Types.ObjectId(userId),
      month: targetMonth
    });

    // Make sure each budget's spent status is updated
    const { startOfMonth, endOfMonth } = getMonthBoundaries(targetMonth);

    for (const budget of budgets) {
      const currentSpent = await calculateBudgetSpent(
        new Types.ObjectId(userId),
        budget.category,
        startOfMonth,
        endOfMonth
      );

      if (budget.spent !== currentSpent) {
        budget.spent = currentSpent;
        await budget.save();
      }
    }

    res.status(200).json({ success: true, month: targetMonth, count: budgets.length, budgets });
  } catch (error) {
    next(error);
  }
};

export const deleteBudget = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const budget = await Budget.findOneAndDelete({ _id: id, userId });
    if (!budget) {
      res.status(404).json({ success: false, message: 'Budget not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Budget deleted successfully' });
  } catch (error) {
    next(error);
  }
};
