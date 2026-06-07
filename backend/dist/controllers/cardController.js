"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCard = exports.updateCard = exports.getCardById = exports.getCards = exports.createCard = void 0;
const mongoose_1 = require("mongoose");
const CreditCard_1 = require("../models/CreditCard");
const Expense_1 = require("../models/Expense");
const validators_1 = require("../validators");
const createCard = async (req, res, next) => {
    try {
        const validated = validators_1.creditCardSchema.parse(req.body);
        const userId = req.user.id;
        // Check if card name is already registered for this user
        const existingCard = await CreditCard_1.CreditCard.findOne({ userId: new mongoose_1.Types.ObjectId(userId), cardName: validated.cardName });
        if (existingCard) {
            res.status(400).json({ success: false, message: 'Card with this name already exists' });
            return;
        }
        const card = await CreditCard_1.CreditCard.create({
            userId: new mongoose_1.Types.ObjectId(userId),
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
    }
    catch (error) {
        next(error);
    }
};
exports.createCard = createCard;
const getCards = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const cards = await CreditCard_1.CreditCard.find({ userId: new mongoose_1.Types.ObjectId(userId) }).sort({ createdAt: -1 });
        // Ensure card balances are accurately in sync with expenses
        for (const card of cards) {
            const cardExpenses = await Expense_1.Expense.aggregate([
                {
                    $match: {
                        userId: new mongoose_1.Types.ObjectId(userId),
                        paymentMethod: 'credit_card',
                        creditCardId: card._id
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const actualBalance = cardExpenses[0]?.total || 0;
            if (card.currentBalance !== actualBalance) {
                card.currentBalance = actualBalance;
                await card.save();
            }
        }
        res.status(200).json({ success: true, count: cards.length, cards });
    }
    catch (error) {
        next(error);
    }
};
exports.getCards = getCards;
const getCardById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const card = await CreditCard_1.CreditCard.findOne({ _id: id, userId });
        if (!card) {
            res.status(404).json({ success: false, message: 'Credit card not found' });
            return;
        }
        // Sync balance with actual expenses
        const cardExpenses = await Expense_1.Expense.aggregate([
            {
                $match: {
                    userId: new mongoose_1.Types.ObjectId(userId),
                    paymentMethod: 'credit_card',
                    creditCardId: card._id
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        card.currentBalance = cardExpenses[0]?.total || 0;
        await card.save();
        res.status(200).json({ success: true, card });
    }
    catch (error) {
        next(error);
    }
};
exports.getCardById = getCardById;
const updateCard = async (req, res, next) => {
    try {
        const { id } = req.params;
        const validated = validators_1.creditCardSchema.parse(req.body);
        const userId = req.user.id;
        const card = await CreditCard_1.CreditCard.findOne({ _id: id, userId });
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
    }
    catch (error) {
        next(error);
    }
};
exports.updateCard = updateCard;
const deleteCard = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const card = await CreditCard_1.CreditCard.findOneAndDelete({ _id: id, userId });
        if (!card) {
            res.status(404).json({ success: false, message: 'Credit card not found' });
            return;
        }
        // Set associated expenses' creditCardId to null
        await Expense_1.Expense.updateMany({ creditCardId: id, userId }, { $set: { creditCardId: null, paymentMethod: 'debit_card' } } // Fallback payment method
        );
        res.status(200).json({ success: true, message: 'Credit card deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCard = deleteCard;
