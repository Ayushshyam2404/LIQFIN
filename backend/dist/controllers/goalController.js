"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFundsToGoal = exports.deleteGoal = exports.updateGoal = exports.getGoals = exports.createGoal = void 0;
const mongoose_1 = require("mongoose");
const Goal_1 = require("../models/Goal");
const Notification_1 = require("../models/Notification");
const validators_1 = require("../validators");
const createGoal = async (req, res, next) => {
    try {
        const validated = validators_1.goalSchema.parse(req.body);
        const userId = req.user.id;
        const goal = await Goal_1.Goal.create({
            userId: new mongoose_1.Types.ObjectId(userId),
            title: validated.title,
            targetAmount: validated.targetAmount,
            currentAmount: validated.currentAmount || 0,
            category: validated.category || 'other',
            deadline: new Date(validated.deadline)
        });
        res.status(201).json({ success: true, goal });
    }
    catch (error) {
        next(error);
    }
};
exports.createGoal = createGoal;
const getGoals = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const goals = await Goal_1.Goal.find({ userId: new mongoose_1.Types.ObjectId(userId) }).sort({ deadline: 1 });
        res.status(200).json({ success: true, count: goals.length, goals });
    }
    catch (error) {
        next(error);
    }
};
exports.getGoals = getGoals;
const updateGoal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const validated = validators_1.goalSchema.parse(req.body);
        const userId = req.user.id;
        const goal = await Goal_1.Goal.findOne({ _id: id, userId });
        if (!goal) {
            res.status(404).json({ success: false, message: 'Savings goal not found' });
            return;
        }
        goal.title = validated.title;
        goal.targetAmount = validated.targetAmount;
        goal.currentAmount = validated.currentAmount !== undefined ? validated.currentAmount : goal.currentAmount;
        goal.category = validated.category || goal.category;
        goal.deadline = new Date(validated.deadline);
        const updatedGoal = await goal.save();
        // Check if goal was reached
        if (updatedGoal.currentAmount >= updatedGoal.targetAmount) {
            await Notification_1.Notification.create({
                userId: new mongoose_1.Types.ObjectId(userId),
                title: 'Goal Achieved! 🎉',
                message: `Congratulations! You have reached your savings goal of $${updatedGoal.targetAmount.toFixed(2)} for "${updatedGoal.title}".`,
                type: 'success'
            });
        }
        res.status(200).json({ success: true, goal: updatedGoal });
    }
    catch (error) {
        next(error);
    }
};
exports.updateGoal = updateGoal;
const deleteGoal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const goal = await Goal_1.Goal.findOneAndDelete({ _id: id, userId });
        if (!goal) {
            res.status(404).json({ success: false, message: 'Savings goal not found' });
            return;
        }
        res.status(200).json({ success: true, message: 'Goal deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteGoal = deleteGoal;
const addFundsToGoal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amount } = req.body;
        const userId = req.user.id;
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            res.status(400).json({ success: false, message: 'Please provide a valid deposit amount greater than 0' });
            return;
        }
        const goal = await Goal_1.Goal.findOne({ _id: id, userId });
        if (!goal) {
            res.status(404).json({ success: false, message: 'Savings goal not found' });
            return;
        }
        goal.currentAmount += amount;
        const updatedGoal = await goal.save();
        // Notify if completed
        if (updatedGoal.currentAmount >= updatedGoal.targetAmount) {
            await Notification_1.Notification.create({
                userId: new mongoose_1.Types.ObjectId(userId),
                title: 'Goal Achieved! 🎉',
                message: `Congratulations! You have reached your savings goal of $${updatedGoal.targetAmount.toFixed(2)} for "${updatedGoal.title}".`,
                type: 'success'
            });
        }
        else {
            // Notify milestone if 50% or 75% etc
            const percentage = (updatedGoal.currentAmount / updatedGoal.targetAmount) * 100;
            if (percentage >= 50 && percentage - (amount / updatedGoal.targetAmount * 100) < 50) {
                await Notification_1.Notification.create({
                    userId: new mongoose_1.Types.ObjectId(userId),
                    title: 'Goal Milestone: 50% Reached!',
                    message: `Nice work! You've saved half of your target ($${updatedGoal.currentAmount.toFixed(2)} / $${updatedGoal.targetAmount.toFixed(2)}) for "${updatedGoal.title}".`,
                    type: 'success'
                });
            }
        }
        res.status(200).json({ success: true, goal: updatedGoal });
    }
    catch (error) {
        next(error);
    }
};
exports.addFundsToGoal = addFundsToGoal;
