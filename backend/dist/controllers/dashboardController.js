"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const mongoose_1 = require("mongoose");
const Expense_1 = require("../models/Expense");
const CreditCard_1 = require("../models/CreditCard");
const Goal_1 = require("../models/Goal");
const getDashboardStats = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const userObjectId = new mongoose_1.Types.ObjectId(userId);
        // 1. Total Monthly Expenses
        const currentMonthExpensesAgg = await Expense_1.Expense.aggregate([
            {
                $match: {
                    userId: userObjectId,
                    date: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);
        const monthlyExpenses = currentMonthExpensesAgg[0]?.total || 0;
        // 2. Previous Month Expenses for Trend Comparison
        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        const prevMonthExpensesAgg = await Expense_1.Expense.aggregate([
            {
                $match: {
                    userId: userObjectId,
                    date: { $gte: startOfPrevMonth, $lte: endOfPrevMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);
        const prevMonthlyExpenses = prevMonthExpensesAgg[0]?.total || 0;
        // 3. Credit Cards Aggregations (Balances and Limits)
        const cards = await CreditCard_1.CreditCard.find({ userId: userObjectId });
        let totalCreditLimit = 0;
        let totalCreditBalance = 0;
        cards.forEach(card => {
            totalCreditLimit += card.creditLimit;
            totalCreditBalance += card.currentBalance;
        });
        const creditUtilization = totalCreditLimit > 0 ? (totalCreditBalance / totalCreditLimit) * 100 : 0;
        // 4. Savings Goals Progress
        const goals = await Goal_1.Goal.find({ userId: userObjectId });
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
        const categoryBreakdown = await Expense_1.Expense.aggregate([
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
        const spendingTrends = await Expense_1.Expense.aggregate([
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
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardStats = getDashboardStats;
