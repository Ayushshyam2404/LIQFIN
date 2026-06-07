import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Budget } from '../models/Budget';
import { Expense } from '../models/Expense';
import { budgetSchema } from '../validators';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const createOrUpdateBudget = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = budgetSchema.parse(req.body);
    const userId = req.user!.id;

    // Calculate current spent for this category/month
    const startOfMonth = new Date(`${validated.month}-01`);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59);

    const matchFilter: any = {
      userId: new Types.ObjectId(userId),
      date: { $gte: startOfMonth, $lte: endOfMonth }
    };

    if (validated.category !== 'all') {
      matchFilter.category = validated.category;
    }

    const spentAggregate = await Expense.aggregate([
      { $match: matchFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const currentSpent = spentAggregate[0]?.total || 0;

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

    // Default to current month YYYY-MM
    const targetMonth = month ? month.toString() : (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    const budgets = await Budget.find({
      userId: new Types.ObjectId(userId),
      month: targetMonth
    });

    // Make sure each budget's spent status is updated
    const startOfMonth = new Date(`${targetMonth}-01`);
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59);

    for (const budget of budgets) {
      const matchFilter: any = {
        userId: new Types.ObjectId(userId),
        date: { $gte: startOfMonth, $lte: endOfMonth }
      };

      if (budget.category !== 'all') {
        matchFilter.category = budget.category;
      }

      const spentAggregate = await Expense.aggregate([
        { $match: matchFilter },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const currentSpent = spentAggregate[0]?.total || 0;

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
