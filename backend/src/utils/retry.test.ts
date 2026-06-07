import assert from 'node:assert';
import test from 'node:test';
import { retry } from './retry';

test('retry utility - succeeds on first attempt', async () => {
  let calls = 0;
  const result = await retry(async () => {
    calls++;
    return 'success';
  }, 3, 5, 1.5);

  assert.strictEqual(result, 'success');
  assert.strictEqual(calls, 1);
});

test('retry utility - retries and eventually succeeds', async () => {
  let calls = 0;
  const result = await retry(async () => {
    calls++;
    if (calls < 3) {
      throw new Error('temporary failure');
    }
    return 'success';
  }, 4, 5, 1.5);

  assert.strictEqual(result, 'success');
  assert.strictEqual(calls, 3);
});

test('retry utility - throws error after max retries', async () => {
  let calls = 0;
  await assert.rejects(
    async () => {
      await retry(async () => {
        calls++;
        throw new Error('persistent failure');
      }, 3, 5, 1.5);
    },
    (err: Error) => {
      assert.strictEqual(err.message, 'persistent failure');
      return true;
    }
  );
  assert.strictEqual(calls, 3);
});
