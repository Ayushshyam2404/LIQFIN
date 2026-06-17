import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Expense } from '../models/Expense';
import { Budget } from '../models/Budget';
import { CreditCard } from '../models/CreditCard';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { expenseSchema } from '../validators';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { parseTransactionEmail } from '../utils/emailParser';
import { toYearMonth, getStartOfMonth, getEndOfMonth } from '../utils/dateHelpers';
import { sumExpenses, calculateCardBalance } from '../utils/aggregateHelpers';

// Utility helper to update budget and alert user if limit exceeded
export const syncBudgetAndNotify = async (userId: string, category: string, date: Date) => {
  const yearMonth = toYearMonth(date);
  const startOfMonth = getStartOfMonth(date);
  const endOfMonth = getEndOfMonth(date);
  const userObjectId = new Types.ObjectId(userId);
  const dateRange = { start: startOfMonth, end: endOfMonth };

  // 1. Update Specific Category Budget
  const newCategorySpent = await sumExpenses({ userId: userObjectId, dateRange, category });

  const categoryBudget = await Budget.findOne({ userId: userObjectId, category, month: yearMonth });
  if (categoryBudget) {
    categoryBudget.spent = newCategorySpent;
    await categoryBudget.save();

    if (categoryBudget.spent > categoryBudget.limit) {
      await Notification.create({
        userId: userObjectId,
        title: 'Budget Limit Exceeded',
        message: `You have spent $${categoryBudget.spent.toFixed(2)} on "${category}" which exceeds your limit of $${categoryBudget.limit.toFixed(2)} for ${yearMonth}.`,
        type: 'warning'
      });
    }
  }

  // 2. Update 'All' (Total Monthly) Budget
  const newTotalSpent = await sumExpenses({ userId: userObjectId, dateRange });

  const totalBudget = await Budget.findOne({ userId: userObjectId, category: 'all', month: yearMonth });
  if (totalBudget) {
    totalBudget.spent = newTotalSpent;
    await totalBudget.save();

    if (totalBudget.spent > totalBudget.limit) {
      await Notification.create({
        userId: userObjectId,
        title: 'Monthly Budget Limit Exceeded',
        message: `Your total monthly spend of $${totalBudget.spent.toFixed(2)} exceeds your total budget of $${totalBudget.limit.toFixed(2)} for ${yearMonth}.`,
        type: 'danger'
      });
    }
  }
};

// Utility helper to update credit card balance
export const syncCreditCardBalance = async (cardId: string | null | undefined, userId: string) => {
  if (!cardId) return;

  const userObjectId = new Types.ObjectId(userId);
  const cardObjectId = new Types.ObjectId(cardId);
  const newBalance = await calculateCardBalance(userObjectId, cardObjectId);

  const card = await CreditCard.findById(cardId);
  if (card) {
    card.currentBalance = newBalance;
    await card.save();

    // Check utilization and alert if it exceeds 80%
    const utilizationRate = (card.currentBalance / card.creditLimit) * 100;
    if (utilizationRate >= 80) {
      await Notification.create({
        userId: userObjectId,
        title: 'High Credit Card Utilization',
        message: `Your credit card "${card.cardName}" has reached ${utilizationRate.toFixed(1)}% utilization ($${card.currentBalance.toFixed(2)} / $${card.creditLimit.toFixed(2)}).`,
        type: 'warning'
      });
    }
  }
};

export const createExpense = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = expenseSchema.parse(req.body);
    const userId = req.user!.id;

    // Check if card is selected but payment method isn't card
    if (validated.paymentMethod === 'credit_card' && !validated.creditCardId) {
      res.status(400).json({ success: false, message: 'Credit card must be selected for Credit Card payment method' });
      return;
    }

    const newExpense = await Expense.create({
      userId: new Types.ObjectId(userId),
      title: validated.title,
      amount: validated.amount,
      category: validated.category,
      paymentMethod: validated.paymentMethod,
      creditCardId: validated.creditCardId ? new Types.ObjectId(validated.creditCardId) : null,
      date: validated.date ? new Date(validated.date) : new Date(),
      notes: validated.notes || '',
      receipt: validated.receipt || '',
      tags: validated.tags || []
    });

    // Synchronize budgets and credit card balances
    await syncBudgetAndNotify(userId, newExpense.category, newExpense.date);
    if (newExpense.paymentMethod === 'credit_card' && newExpense.creditCardId) {
      await syncCreditCardBalance(newExpense.creditCardId.toString(), userId);
    }

    res.status(201).json({ success: true, expense: newExpense });
  } catch (error) {
    next(error);
  }
};

export const getExpenses = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { category, paymentMethod, search, startDate, endDate, sort = 'desc', limit = 100 } = req.query;

    const filter: any = { userId: new Types.ObjectId(userId) };

    if (category) filter.category = category;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (search) {
      filter.$or = [
        { title: { $regex: search.toString(), $options: 'i' } },
        { notes: { $regex: search.toString(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.toString(), 'i')] } }
      ];
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate.toString());
      if (endDate) filter.date.$lte = new Date(endDate.toString());
    }

    const sortOrder = sort === 'asc' ? 1 : -1;

    const expenses = await Expense.find(filter)
      .sort({ date: sortOrder, createdAt: sortOrder })
      .limit(Number(limit))
      .populate('creditCardId', 'cardName bank');

    res.status(200).json({ success: true, count: expenses.length, expenses });
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const validated = expenseSchema.parse(req.body);
    const userId = req.user!.id;

    const expense = await Expense.findOne({ _id: id, userId });
    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }

    const oldCategory = expense.category;
    const oldDate = expense.date;
    const oldCardId = expense.creditCardId?.toString();
    const oldPaymentMethod = expense.paymentMethod;

    expense.title = validated.title;
    expense.amount = validated.amount;
    expense.category = validated.category;
    expense.paymentMethod = validated.paymentMethod;
    expense.creditCardId = validated.creditCardId ? new Types.ObjectId(validated.creditCardId) : null;
    expense.date = validated.date ? new Date(validated.date) : expense.date;
    expense.notes = validated.notes || '';
    expense.receipt = validated.receipt || '';
    expense.tags = validated.tags || [];

    const updatedExpense = await expense.save();

    // Sync old budget parameters and new budget parameters
    await syncBudgetAndNotify(userId, oldCategory, oldDate);
    if (updatedExpense.category !== oldCategory || updatedExpense.date.getMonth() !== oldDate.getMonth() || updatedExpense.date.getFullYear() !== oldDate.getFullYear()) {
      await syncBudgetAndNotify(userId, updatedExpense.category, updatedExpense.date);
    }

    // Sync credit card balances
    if (oldPaymentMethod === 'credit_card' && oldCardId) {
      await syncCreditCardBalance(oldCardId, userId);
    }
    if (updatedExpense.paymentMethod === 'credit_card' && updatedExpense.creditCardId) {
      await syncCreditCardBalance(updatedExpense.creditCardId.toString(), userId);
    }

    res.status(200).json({ success: true, expense: updatedExpense });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const expense = await Expense.findOneAndDelete({ _id: id, userId });
    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }

    // Sync budget and credit card balance
    await syncBudgetAndNotify(userId, expense.category, expense.date);
    if (expense.paymentMethod === 'credit_card' && expense.creditCardId) {
      await syncCreditCardBalance(expense.creditCardId.toString(), userId);
    }

    res.status(200).json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteExpenses = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ids } = req.body;
    const userId = req.user!.id;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: 'Invalid or empty expense IDs array' });
      return;
    }

    const objectIds = ids.map(id => new Types.ObjectId(id));
    
    // Fetch affected expenses for syncing later
    const affectedExpenses = await Expense.find({ _id: { $in: objectIds }, userId });

    await Expense.deleteMany({ _id: { $in: objectIds }, userId });

    // Sync budget limits and cards for all deleted items
    for (const exp of affectedExpenses) {
      await syncBudgetAndNotify(userId, exp.category, exp.date);
      if (exp.paymentMethod === 'credit_card' && exp.creditCardId) {
        await syncCreditCardBalance(exp.creditCardId.toString(), userId);
      }
    }

    res.status(200).json({ success: true, message: `${affectedExpenses.length} expenses deleted successfully` });
  } catch (error) {
    next(error);
  }
};

export const duplicateExpense = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const expense = await Expense.findOne({ _id: id, userId });
    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }

    const duplicated = await Expense.create({
      userId: new Types.ObjectId(userId),
      title: `${expense.title} (Copy)`,
      amount: expense.amount,
      category: expense.category,
      paymentMethod: expense.paymentMethod,
      creditCardId: expense.creditCardId,
      date: new Date(), // Set to today
      notes: expense.notes,
      receipt: expense.receipt,
      tags: expense.tags
    });

    await syncBudgetAndNotify(userId, duplicated.category, duplicated.date);
    if (duplicated.paymentMethod === 'credit_card' && duplicated.creditCardId) {
      await syncCreditCardBalance(duplicated.creditCardId.toString(), userId);
    }

    res.status(201).json({ success: true, expense: duplicated });
  } catch (error) {
    next(error);
  }
};

// OCR and Upload Receipt Mock API
export const uploadReceipt = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Please upload a receipt image' });
      return;
    }

    // Mock OCR parsing results
    const mockTitles = ['Apple Store', 'Whole Foods', 'Starbucks Coffee', 'Uber Ride', 'Chevron Gas Station', 'Netflix Subscription'];
    const mockAmounts = [1299.00, 84.50, 6.75, 24.30, 45.00, 15.49];
    const mockCategories = ['Shopping', 'Groceries', 'Food', 'Travel', 'Transportation', 'Entertainment'];

    const randomIndex = Math.floor(Math.random() * mockTitles.length);

    res.status(200).json({
      success: true,
      filename: req.file.filename,
      ocrData: {
        title: mockTitles[randomIndex],
        amount: mockAmounts[randomIndex],
        category: mockCategories[randomIndex],
        date: new Date(),
        confidence: 0.94
      }
    });
  } catch (error) {
    next(error);
  }
};

export const handleEmailWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { emailContent } = req.body;
    if (!emailContent) {
      res.status(400).json({ success: false, message: 'emailContent is required' });
      return;
    }

    const parsed = parseTransactionEmail(emailContent);
    if (!parsed) {
      res.status(400).json({ success: false, message: 'Failed to parse transaction from email content' });
      return;
    }

    // Identify target user
    const email = req.query.email || req.body.email || 'demo@liquid.finance';
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ success: false, message: 'Target user not found' });
      return;
    }

    // Search for a card matching the last 4 digits
    let card = await CreditCard.findOne({ userId: user._id, cardNumberLastFour: parsed.cardDigits });

    // If card doesn't exist, dynamically create it
    if (!card) {
      card = await CreditCard.create({
        userId: user._id,
        cardName: `${parsed.bankName} ${parsed.cardDigits}`,
        bank: parsed.bankName,
        creditLimit: parsed.creditLimit || 500, // mock/fallback limit
        currentBalance: 0,
        statementDate: 1,
        dueDate: 20,
        minimumPayment: 35,
        annualFee: 0,
        rewardsNotes: `Automatically created via ${parsed.bankName} transaction alert.`,
        colorTheme: 'silver-blue',
        cardNumberLastFour: parsed.cardDigits
      });
    }

    // Log the transaction as an expense
    const newExpense = await Expense.create({
      userId: user._id,
      title: parsed.merchant,
      amount: parsed.amount,
      category: parsed.category,
      paymentMethod: 'credit_card',
      creditCardId: card._id,
      date: parsed.date || new Date(),
      notes: `Auto-parsed from email alert. Original: ${parsed.originalAmount}`,
      tags: ['auto-parsed', 'email-webhook']
    });

    // Synchronize budgets and credit card balances
    await syncBudgetAndNotify(user._id.toString(), newExpense.category, newExpense.date);
    await syncCreditCardBalance(card._id.toString(), user._id.toString());

    // Create confirmation notification
    await Notification.create({
      userId: user._id,
      title: 'Email Alert Parsed',
      message: `Automatically logged $${parsed.amount.toFixed(2)} (${parsed.originalAmount}) at "${parsed.merchant}" on card ending ${parsed.cardDigits}.`,
      type: 'success'
    });

    res.status(201).json({
      success: true,
      message: 'Transaction processed successfully',
      expense: newExpense,
      card
    });
  } catch (error) {
    next(error);
  }
};

