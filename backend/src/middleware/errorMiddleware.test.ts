import assert from 'node:assert';
import { describe, it, beforeEach } from 'node:test';
import { errorHandler } from './errorMiddleware';

const createMockReqRes = (statusCodeOverride = 200) => {
  let capturedStatus = 0;
  let capturedJson: any = null;

  const req: any = {
    method: 'GET',
    originalUrl: '/test',
    ip: '127.0.0.1',
  };

  const res: any = {
    statusCode: statusCodeOverride,
    status(code: number) {
      capturedStatus = code;
      return res;
    },
    json(data: any) {
      capturedJson = data;
      return res;
    },
  };

  const next: any = () => {};

  return {
    req,
    res,
    next,
    getStatus: () => capturedStatus,
    getJson: () => capturedJson,
  };
};

describe('errorHandler middleware', () => {
  it('returns 500 when res.statusCode is 200 (default)', () => {
    const { req, res, next, getStatus, getJson } = createMockReqRes(200);
    const err = new Error('Something broke');
    errorHandler(err, req, res, next);
    assert.strictEqual(getStatus(), 500);
    assert.strictEqual(getJson().success, false);
    assert.strictEqual(getJson().message, 'Something broke');
  });

  it('preserves a non-200 status code', () => {
    const { req, res, next, getStatus } = createMockReqRes(404);
    errorHandler(new Error('Not found'), req, res, next);
    assert.strictEqual(getStatus(), 404);
  });

  it('handles mongoose ValidationError', () => {
    const { req, res, next, getStatus, getJson } = createMockReqRes();
    const err: any = new Error('Validation Error');
    err.name = 'ValidationError';
    err.errors = {
      email: { message: 'Invalid email' },
      name: { message: 'Name required' },
    };
    errorHandler(err, req, res, next);
    assert.strictEqual(getStatus(), 400);
    assert.strictEqual(getJson().message, 'Validation Error');
    assert.deepStrictEqual(getJson().errors, {
      email: 'Invalid email',
      name: 'Name required',
    });
  });

  it('handles mongoose CastError', () => {
    const { req, res, next, getStatus, getJson } = createMockReqRes();
    const err: any = new Error('CastError');
    err.name = 'CastError';
    err.path = '_id';
    errorHandler(err, req, res, next);
    assert.strictEqual(getStatus(), 400);
    assert.ok(getJson().message.includes('_id'));
  });

  it('handles MongoDB duplicate key error (code 11000)', () => {
    const { req, res, next, getStatus, getJson } = createMockReqRes();
    const err: any = new Error('duplicate');
    err.code = 11000;
    err.keyValue = { email: 'test@test.com' };
    errorHandler(err, req, res, next);
    assert.strictEqual(getStatus(), 409);
    assert.ok(getJson().message.includes('email'));
  });

  it('handles duplicate key error with missing keyValue', () => {
    const { req, res, next, getStatus, getJson } = createMockReqRes();
    const err: any = new Error('duplicate');
    err.code = 11000;
    errorHandler(err, req, res, next);
    assert.strictEqual(getStatus(), 409);
    assert.ok(getJson().message.includes('field'));
  });

  it('handles JsonWebTokenError', () => {
    const { req, res, next, getStatus, getJson } = createMockReqRes();
    const err: any = new Error('jwt malformed');
    err.name = 'JsonWebTokenError';
    errorHandler(err, req, res, next);
    assert.strictEqual(getStatus(), 401);
    assert.ok(getJson().message.includes('Invalid authentication token'));
  });

  it('handles TokenExpiredError', () => {
    const { req, res, next, getStatus, getJson } = createMockReqRes();
    const err: any = new Error('jwt expired');
    err.name = 'TokenExpiredError';
    errorHandler(err, req, res, next);
    assert.strictEqual(getStatus(), 401);
    assert.ok(getJson().message.includes('expired'));
  });

  it('includes stack trace when not in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const { req, res, next, getJson } = createMockReqRes();
    const err = new Error('test');
    errorHandler(err, req, res, next);
    assert.ok(getJson().stack);
    process.env.NODE_ENV = originalEnv;
  });

  it('omits stack trace in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const { req, res, next, getJson } = createMockReqRes();
    const err = new Error('test');
    errorHandler(err, req, res, next);
    assert.strictEqual(getJson().stack, undefined);
    process.env.NODE_ENV = originalEnv;
  });
});
