import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { CreditCard } from '../models/CreditCard';
import { Expense } from '../models/Expense';
import { creditCardSchema } from '../validators';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { calculateCardBalance } from '../utils/aggregateHelpers';

export const createCard = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = creditCardSchema.parse(req.body);
    const userId = req.user!.id;

    // Check if card name is already registered for this user
    const existingCard = await CreditCard.findOne({ userId: new Types.ObjectId(userId), cardName: validated.cardName });
    if (existingCard) {
      res.status(400).json({ success: false, message: 'Card with this name already exists' });
      return;
    }

    const card = await CreditCard.create({
      userId: new Types.ObjectId(userId),
      cardName: validated.cardName,
      bank: validated.bank,
      creditLimit: validated.creditLimit,
      currentBalance: validated.currentBalance || 0,
      statementDate: validated.statementDate,
      dueDate: validated.dueDate,
      minimumPayment: validated.minimumPayment || 0,
      annualFee: validated.annualFee || 0,
      rewardsNotes: validated.rewardsNotes || '',
      colorTheme: validated.colorTheme || 'purple-pink',
      cardNumberLastFour: validated.cardNumberLastFour || '0000'
    });

    res.status(201).json({ success: true, card });
  } catch (error) {
    next(error);
  }
};

export const getCards = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const cards = await CreditCard.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 });

    // Ensure card balances are accurately in sync with expenses
    const userObjectId = new Types.ObjectId(userId);
    for (const card of cards) {
      const actualBalance = await calculateCardBalance(userObjectId, card._id);
      if (card.currentBalance !== actualBalance) {
        card.currentBalance = actualBalance;
        await card.save();
      }
    }

    res.status(200).json({ success: true, count: cards.length, cards });
  } catch (error) {
    next(error);
  }
};

export const getCardById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const card = await CreditCard.findOne({ _id: id, userId });
    if (!card) {
      res.status(404).json({ success: false, message: 'Credit card not found' });
      return;
    }

    // Sync balance with actual expenses
    card.currentBalance = await calculateCardBalance(new Types.ObjectId(userId), card._id);
    await card.save();

    res.status(200).json({ success: true, card });
  } catch (error) {
    next(error);
  }
};

export const updateCard = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const validated = creditCardSchema.parse(req.body);
    const userId = req.user!.id;

    const card = await CreditCard.findOne({ _id: id, userId });
    if (!card) {
      res.status(404).json({ success: false, message: 'Credit card not found' });
      return;
    }

    card.cardName = validated.cardName;
    card.bank = validated.bank;
    card.creditLimit = validated.creditLimit;
    card.statementDate = validated.statementDate;
    card.dueDate = validated.dueDate;
    card.minimumPayment = validated.minimumPayment || 0;
    card.annualFee = validated.annualFee || 0;
    card.rewardsNotes = validated.rewardsNotes || '';
    card.colorTheme = validated.colorTheme || card.colorTheme;
    card.cardNumberLastFour = validated.cardNumberLastFour || card.cardNumberLastFour;

    const updatedCard = await card.save();
    res.status(200).json({ success: true, card: updatedCard });
  } catch (error) {
    next(error);
  }
};

export const deleteCard = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const card = await CreditCard.findOneAndDelete({ _id: id, userId });
    if (!card) {
      res.status(404).json({ success: false, message: 'Credit card not found' });
      return;
    }

    // Set associated expenses' creditCardId to null
    await Expense.updateMany(
      { creditCardId: id, userId },
      { $set: { creditCardId: null, paymentMethod: 'debit_card' } } // Fallback payment method
    );

    res.status(200).json({ success: true, message: 'Credit card deleted successfully' });
  } catch (error) {
    next(error);
  }
};
