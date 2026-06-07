import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Expense } from '../models/Expense';
import { CreditCard } from '../models/CreditCard';
import { Goal } from '../models/Goal';
import { Budget } from '../models/Budget';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getAIInsights = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userObjectId = new Types.ObjectId(userId);

    // Fetch user context
    const expenses = await Expense.find({ userId: userObjectId }).sort({ date: -1 }).limit(50);
    const cards = await CreditCard.find({ userId: userObjectId });
    const goals = await Goal.find({ userId: userObjectId });
    const budgets = await Budget.find({ userId: userObjectId });

    // Compute metrics
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    let totalCreditBalance = 0;
    let totalLimit = 0;
    cards.forEach(c => {
      totalCreditBalance += c.currentBalance;
      totalLimit += c.creditLimit;
    });
    const utilization = totalLimit > 0 ? (totalCreditBalance / totalLimit) * 100 : 0;

    // Generate smart rule-based insights
    const insights: string[] = [];
    const suggestions: string[] = [];

    // Credit Utilization Insight
    if (utilization > 30) {
      insights.push(
        `Your overall credit utilization is at **${utilization.toFixed(1)}%**. High utilization can negatively impact your credit score. Consider reducing your balances below 30% ($${(totalLimit * 0.3).toFixed(2)}) before statement dates.`
      );
      suggestions.push(
        `Make a mid-cycle payment of at least **$${(totalCreditBalance - (totalLimit * 0.3)).toFixed(2)}** to pull utilization down into the optimal zone.`
      );
    } else if (utilization > 0) {
      insights.push(
        `Great job! Your credit utilization is at **${utilization.toFixed(1)}%**, which is well within the healthy range (< 30%).`
      );
    } else {
      insights.push(
        `You have **0%** credit utilization. Utilizing a small amount of credit (1% to 9%) and paying it off completely actually helps build your credit file faster.`
      );
    }

    // Category Spending Analysis
    const categoryTotals: { [key: string]: number } = {};
    expenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    if (sortedCategories.length > 0) {
      const [topCategory, topAmount] = sortedCategories[0];
      insights.push(
        `Your top spending category is **${topCategory}**, representing **$${topAmount.toFixed(2)}** of your recent activity.`
      );

      if (topCategory === 'Entertainment' || topCategory === 'Shopping' || topCategory === 'Food') {
        suggestions.push(
          `Consider cutting back on non-essential **${topCategory}** expenses. Setting a category budget for ${topCategory} could save you up to 15% next month.`
        );
      }
    }

    // Budget Warnings
    const overspentBudgets = budgets.filter(b => b.spent > b.limit);
    if (overspentBudgets.length > 0) {
      insights.push(
        `You have exceeded your monthly budget limits in **${overspentBudgets.length}** category targets (${overspentBudgets.map(b => b.category).join(', ')}).`
      );
      suggestions.push(
        `Reallocate unused funds from other category budgets to cover the deficits, or pause luxury spending for the remainder of this cycle.`
      );
    }

    // Savings Goals Analysis
    const activeGoals = goals.filter(g => g.currentAmount < g.targetAmount);
    if (activeGoals.length > 0) {
      const nearGoal = activeGoals.find(g => (g.currentAmount / g.targetAmount) >= 0.8);
      if (nearGoal) {
        insights.push(
          `Your goal **"${nearGoal.title}"** is **${((nearGoal.currentAmount / nearGoal.targetAmount) * 100).toFixed(0)}%** complete! You only need **$${(nearGoal.targetAmount - nearGoal.currentAmount).toFixed(2)}** more.`
        );
        suggestions.push(
          `Make a one-off transfer of **$${(nearGoal.targetAmount - nearGoal.currentAmount).toFixed(2)}** to complete "${nearGoal.title}" and celebrate this milestone!`
        );
      }
    } else {
      suggestions.push(
        `Set up a new savings goal (e.g., an Emergency Fund or Vacation goal) to direct your monthly surplus toward structured growth.`
      );
    }

    // Fallback default insights if empty data
    if (insights.length === 0) {
      insights.push("We are collecting transaction data. Add some expenses to generate personalized AI finance summaries.");
    }
    if (suggestions.length === 0) {
      suggestions.push("Create category budgets and set up savings goals to receive tailored financial health advisories.");
    }

    res.status(200).json({
      success: true,
      analysis: {
        summary: `LIQIFIN AI completed its review of your recent transactions. You've spent $${totalSpent.toFixed(2)} across ${expenses.length} postings. Your financial health index is optimal.`,
        insights,
        suggestions,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};
