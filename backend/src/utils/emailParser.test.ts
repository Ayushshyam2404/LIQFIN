import assert from 'node:assert';
import { describe, it } from 'node:test';
import { classifyMerchantCategory, parseTransactionEmail } from './emailParser';

// ---------- classifyMerchantCategory ----------
describe('classifyMerchantCategory', () => {
  const cases: Array<[string, string]> = [
    ['STARBUCKS', 'Food'],
    ['NOBU Restaurant', 'Food'],
    ['Cafe de Paris', 'Food'],
    ['Local GROCER', 'Groceries'],
    ['Trader Joe\'s', 'Groceries'],
    ['EREWHON MARKET', 'Groceries'],
    ['DELTA Airlines', 'Travel'],
    ['UBER ride', 'Travel'],
    ['LYFT', 'Travel'],
    ['CHEVRON GAS', 'Transportation'],
    ['Shell Station', 'Transportation'],
    ['NETFLIX', 'Entertainment'],
    ['SPOTIFY Premium', 'Entertainment'],
    ['EQUINOX GYM', 'Entertainment'],
    ['ZARA online', 'Shopping'],
    ['NIKE store', 'Shopping'],
    ['AMAZON', 'Shopping'],
    ['Internet BILL', 'Bills'],
    ['Fiber TELECOM', 'Bills'],
    ['CLINIC visit', 'Healthcare'],
    ['DENTAL Care', 'Healthcare'],
    ['HOSPITAL fees', 'Healthcare'],
    ['STOCK Invest', 'Investments'],
    ['Mutual Fund', 'Investments'],
    ['Random XYZ Store', 'Miscellaneous'],
  ];

  for (const [merchant, expected] of cases) {
    it(`classifies "${merchant}" as "${expected}"`, () => {
      assert.strictEqual(classifyMerchantCategory(merchant), expected);
    });
  }
});

// ---------- parseTransactionEmail ----------
describe('parseTransactionEmail', () => {
  it('parses a typical bank alert email', () => {
    const email = [
      'Transaction Amount:',
      'INR 294',
      '',
      'Merchant Name:',
      'TATA STARBU',
      '',
      'Credit Card No.',
      'XX2629',
      '',
      'Axis Bank Alerts',
    ].join('\n');

    const result = parseTransactionEmail(email);
    assert.ok(result, 'Should return a parsed transaction');
    assert.strictEqual(result.amount, 294);
    assert.strictEqual(result.originalAmount, 'INR 294');
    assert.ok(result.merchant.includes('TATA STARBU'));
    assert.strictEqual(result.cardDigits, '2629');
    assert.strictEqual(result.bankName, 'Axis Bank');
    assert.strictEqual(result.category, 'Food');
  });

  it('parses an email with "spent Rs." format', () => {
    const email = 'You have spent Rs. 1,500 at AMAZON for your HDFC Bank Credit Card No. XX4321.';
    const result = parseTransactionEmail(email);
    assert.ok(result);
    assert.strictEqual(result.amount, 1500);
    assert.strictEqual(result.cardDigits, '4321');
  });

  it('returns null when no amount is found', () => {
    const email = 'Hello, this is a normal email with no transaction data.';
    const result = parseTransactionEmail(email);
    assert.strictEqual(result, null);
  });

  it('extracts credit limit and available limit', () => {
    const email = [
      'Amount: INR 500',
      'Merchant Name:',
      'NIKE Store',
      'Total Credit Limit: INR 30,000',
      'Available Limit: INR 29,500',
      'ICICI Bank',
    ].join('\n');

    const result = parseTransactionEmail(email);
    assert.ok(result);
    assert.strictEqual(result.creditLimit, 30000);
    assert.strictEqual(result.availableLimit, 29500);
  });

  it('extracts date and time from email body', () => {
    const email = [
      'Transaction Amount: INR 100',
      'Merchant Name:',
      'SHELL GAS',
      'Date & Time: 15-06-2025, 14:30:00',
      'SBI Bank',
    ].join('\n');

    const result = parseTransactionEmail(email);
    assert.ok(result);
    assert.ok(result.date instanceof Date);
    assert.strictEqual(result.date.getFullYear(), 2025);
  });

  it('defaults bank name to "Axis Bank" when not found', () => {
    const email = 'Amount: INR 50\nMerchant: Unknown Shop';
    const result = parseTransactionEmail(email);
    assert.ok(result);
    assert.strictEqual(result.bankName, 'Axis Bank');
  });

  it('defaults card digits to "0000" when not found', () => {
    const email = 'Amount: INR 200\nMerchant: Generic Store';
    const result = parseTransactionEmail(email);
    assert.ok(result);
    assert.strictEqual(result.cardDigits, '0000');
  });

  it('handles INR amount without explicit currency prefix', () => {
    const email = 'Amount: INR 49.99\nat APPLE STORE\nChase Bank Card 5678';
    const result = parseTransactionEmail(email);
    assert.ok(result);
    assert.strictEqual(result.amount, 49.99);
    assert.strictEqual(result.originalAmount, 'INR 49.99');
    assert.strictEqual(result.category, 'Shopping');
  });
});
