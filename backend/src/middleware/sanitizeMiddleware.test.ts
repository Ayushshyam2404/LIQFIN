import assert from 'node:assert';
import { describe, it } from 'node:test';
import { sanitizeNoSql } from './sanitizeMiddleware';

const createMockReqResNext = (overrides: { body?: any; query?: any; params?: any } = {}) => {
  const req: any = {
    body: overrides.body ?? undefined,
    query: overrides.query ?? undefined,
    params: overrides.params ?? undefined,
  };
  const res: any = {};
  let nextCalled = false;
  const next = () => { nextCalled = true; };
  return { req, res, next, wasNextCalled: () => nextCalled };
};

describe('sanitizeNoSql middleware', () => {
  it('strips keys starting with $ from req.body', () => {
    const { req, res, next, wasNextCalled } = createMockReqResNext({
      body: { name: 'Alice', $gt: 100 },
    });
    sanitizeNoSql(req, res, next);
    assert.deepStrictEqual(req.body, { name: 'Alice' });
    assert.ok(wasNextCalled());
  });

  it('strips keys containing dots from req.body', () => {
    const { req, res, next } = createMockReqResNext({
      body: { 'nested.key': 'evil', safe: 'ok' },
    });
    sanitizeNoSql(req, res, next);
    assert.deepStrictEqual(req.body, { safe: 'ok' });
  });

  it('sanitizes nested objects recursively', () => {
    const { req, res, next } = createMockReqResNext({
      body: { outer: { $where: 'code', valid: 1 } },
    });
    sanitizeNoSql(req, res, next);
    assert.deepStrictEqual(req.body, { outer: { valid: 1 } });
  });

  it('sanitizes arrays inside body', () => {
    const { req, res, next } = createMockReqResNext({
      body: { items: [{ $ne: null, value: 'x' }] },
    });
    sanitizeNoSql(req, res, next);
    assert.deepStrictEqual(req.body, { items: [{ value: 'x' }] });
  });

  it('sanitizes req.query', () => {
    const { req, res, next } = createMockReqResNext({
      query: { search: 'ok', $regex: '.*' },
    });
    sanitizeNoSql(req, res, next);
    assert.deepStrictEqual(req.query, { search: 'ok' });
  });

  it('sanitizes req.params', () => {
    const { req, res, next } = createMockReqResNext({
      params: { id: '123', '$lookup': 'bad' },
    });
    sanitizeNoSql(req, res, next);
    assert.deepStrictEqual(req.params, { id: '123' });
  });

  it('leaves primitive values untouched', () => {
    const { req, res, next } = createMockReqResNext({
      body: { count: 42, name: 'test', flag: true },
    });
    sanitizeNoSql(req, res, next);
    assert.deepStrictEqual(req.body, { count: 42, name: 'test', flag: true });
  });

  it('calls next even when body/query/params are falsy', () => {
    const { req, res, next, wasNextCalled } = createMockReqResNext({});
    sanitizeNoSql(req, res, next);
    assert.ok(wasNextCalled());
  });
});
