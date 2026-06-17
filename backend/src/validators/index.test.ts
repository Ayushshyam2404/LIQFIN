import assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  registerSchema,
  loginSchema,
  expenseSchema,
  creditCardSchema,
  budgetSchema,
  goalSchema,
  recurringSchema,
} from './index';

// ---------- registerSchema ----------
describe('registerSchema', () => {
  it('accepts a valid registration payload', () => {
    const result = registerSchema.safeParse({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret123',
    });
    assert.strictEqual(result.success, true);
  });

  it('rejects a name shorter than 2 characters', () => {
    const result = registerSchema.safeParse({
      name: 'A',
      email: 'a@b.com',
      password: 'secret123',
    });
    assert.strictEqual(result.success, false);
  });

  it('rejects an invalid email', () => {
    const result = registerSchema.safeParse({
      name: 'Alice',
      email: 'not-an-email',
      password: 'secret123',
    });
    assert.strictEqual(result.success, false);
  });

  it('rejects a password shorter than 6 characters', () => {
    const result = registerSchema.safeParse({
      name: 'Alice',
      email: 'alice@example.com',
      password: '12345',
    });
    assert.strictEqual(result.success, false);
  });

  it('allows an optional avatar field', () => {
    const result = registerSchema.safeParse({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret123',
      avatar: 'https://img.example.com/a.png',
    });
    assert.strictEqual(result.success, true);
  });
});

// ---------- loginSchema ----------
describe('loginSchema', () => {
  it('accepts valid login credentials', () => {
    const result = loginSchema.safeParse({
      email: 'bob@example.com',
      password: 'p',
    });
    assert.strictEqual(result.success, true);
  });

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({
      email: 'bob@example.com',
      password: '',
    });
    assert.strictEqual(result.success, false);
  });
});

// ---------- expenseSchema ----------
describe('expenseSchema', () => {
  it('accepts a minimal valid expense', () => {
    const result = expenseSchema.safeParse({
      title: 'Coffee',
      amount: 4.5,
      category: 'Food',
      paymentMethod: 'cash',
    });
    assert.strictEqual(result.success, true);
  });

  it('rejects a non-positive amount', () => {
    const result = expenseSchema.safeParse({
      title: 'Coffee',
      amount: 0,
      category: 'Food',
      paymentMethod: 'cash',
    });
    assert.strictEqual(result.success, false);
  });

  it('rejects a negative amount', () => {
    const result = expenseSchema.safeParse({
      title: 'Coffee',
      amount: -10,
      category: 'Food',
      paymentMethod: 'cash',
    });
    assert.strictEqual(result.success, false);
  });

  it('allows optional fields', () => {
    const result = expenseSchema.safeParse({
      title: 'Flight',
      amount: 500,
      category: 'Travel',
      paymentMethod: 'credit_card',
      creditCardId: '6623abc',
      date: '2025-06-01',
      notes: 'Business trip',
      receipt: 'receipt.jpg',
      tags: ['business', 'travel'],
    });
    assert.strictEqual(result.success, true);
  });

  it('accepts a Date object for date field', () => {
    const result = expenseSchema.safeParse({
      title: 'Lunch',
      amount: 12,
      category: 'Food',
      paymentMethod: 'upi',
      date: new Date(),
    });
    assert.strictEqual(result.success, true);
  });
});

// ---------- creditCardSchema ----------
describe('creditCardSchema', () => {
  it('accepts a valid credit card', () => {
    const result = creditCardSchema.safeParse({
      cardName: 'Platinum',
      bank: 'Chase',
      creditLimit: 10000,
      statementDate: 15,
      dueDate: 5,
    });
    assert.strictEqual(result.success, true);
  });

  it('rejects statementDate > 31', () => {
    const result = creditCardSchema.safeParse({
      cardName: 'Gold',
      bank: 'HDFC',
      creditLimit: 5000,
      statementDate: 32,
      dueDate: 10,
    });
    assert.strictEqual(result.success, false);
  });

  it('rejects statementDate < 1', () => {
    const result = creditCardSchema.safeParse({
      cardName: 'Gold',
      bank: 'HDFC',
      creditLimit: 5000,
      statementDate: 0,
      dueDate: 10,
    });
    assert.strictEqual(result.success, false);
  });

  it('rejects a negative currentBalance', () => {
    const result = creditCardSchema.safeParse({
      cardName: 'Gold',
      bank: 'HDFC',
      creditLimit: 5000,
      statementDate: 1,
      dueDate: 10,
      currentBalance: -100,
    });
    assert.strictEqual(result.success, false);
  });
});

// ---------- budgetSchema ----------
describe('budgetSchema', () => {
  it('accepts a valid budget', () => {
    const result = budgetSchema.safeParse({
      category: 'Food',
      limit: 500,
      month: '2025-06',
    });
    assert.strictEqual(result.success, true);
  });

  it('rejects an invalid month format', () => {
    const result = budgetSchema.safeParse({
      category: 'Food',
      limit: 500,
      month: 'June 2025',
    });
    assert.strictEqual(result.success, false);
  });

  it('rejects a zero limit', () => {
    const result = budgetSchema.safeParse({
      category: 'Food',
      limit: 0,
      month: '2025-01',
    });
    assert.strictEqual(result.success, false);
  });
});

// ---------- goalSchema ----------
describe('goalSchema', () => {
  it('accepts a valid goal', () => {
    const result = goalSchema.safeParse({
      title: 'Vacation Fund',
      targetAmount: 5000,
      deadline: '2025-12-31',
    });
    assert.strictEqual(result.success, true);
  });

  it('accepts a Date object for deadline', () => {
    const result = goalSchema.safeParse({
      title: 'Emergency Fund',
      targetAmount: 10000,
      deadline: new Date('2026-01-01'),
    });
    assert.strictEqual(result.success, true);
  });

  it('rejects a negative currentAmount', () => {
    const result = goalSchema.safeParse({
      title: 'Emergency Fund',
      targetAmount: 10000,
      currentAmount: -1,
      deadline: '2026-01-01',
    });
    assert.strictEqual(result.success, false);
  });

  it('rejects a missing deadline', () => {
    const result = goalSchema.safeParse({
      title: 'Emergency Fund',
      targetAmount: 10000,
    });
    assert.strictEqual(result.success, false);
  });
});

// ---------- recurringSchema ----------
describe('recurringSchema', () => {
  it('accepts a valid recurring transaction', () => {
    const result = recurringSchema.safeParse({
      title: 'Netflix',
      amount: 15.99,
      category: 'Entertainment',
      paymentMethod: 'credit_card',
      frequency: 'monthly',
    });
    assert.strictEqual(result.success, true);
  });

  it('rejects an invalid frequency', () => {
    const result = recurringSchema.safeParse({
      title: 'Netflix',
      amount: 15.99,
      category: 'Entertainment',
      paymentMethod: 'credit_card',
      frequency: 'bi-weekly',
    });
    assert.strictEqual(result.success, false);
  });

  it('accepts all valid frequency values', () => {
    for (const freq of ['daily', 'weekly', 'monthly', 'yearly'] as const) {
      const result = recurringSchema.safeParse({
        title: 'Sub',
        amount: 10,
        category: 'Bills',
        paymentMethod: 'upi',
        frequency: freq,
      });
      assert.strictEqual(result.success, true, `frequency "${freq}" should be valid`);
    }
  });
});
