import assert from 'node:assert';
import { describe, it, before, after } from 'node:test';
import jwt from 'jsonwebtoken';
import { protect } from './authMiddleware';

const TEST_SECRET = 'test-jwt-secret-for-unit-tests';

describe('protect middleware', () => {
  let originalSecret: string | undefined;

  before(() => {
    originalSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = TEST_SECRET;
  });

  after(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  const createMocks = (authHeader?: string, cookie?: string) => {
    let capturedStatus = 0;
    let capturedJson: any = null;
    let nextCalled = false;

    const req: any = {
      headers: authHeader ? { authorization: authHeader } : {},
      cookies: cookie ? { accessToken: cookie } : {},
      user: undefined,
    };

    const res: any = {
      status(code: number) {
        capturedStatus = code;
        return res;
      },
      json(data: any) {
        capturedJson = data;
        return res;
      },
    };

    const next = () => { nextCalled = true; };

    return {
      req,
      res,
      next,
      getStatus: () => capturedStatus,
      getJson: () => capturedJson,
      wasNextCalled: () => nextCalled,
    };
  };

  it('passes with a valid Bearer token', async () => {
    const token = jwt.sign({ id: 'user123', email: 'a@b.com' }, TEST_SECRET);
    const { req, res, next, wasNextCalled } = createMocks(`Bearer ${token}`);
    await protect(req, res, next);
    assert.ok(wasNextCalled());
    assert.strictEqual(req.user.id, 'user123');
    assert.strictEqual(req.user.email, 'a@b.com');
  });

  it('passes with a valid cookie token', async () => {
    const token = jwt.sign({ id: 'user456', email: 'x@y.com' }, TEST_SECRET);
    const { req, res, next, wasNextCalled } = createMocks(undefined, token);
    await protect(req, res, next);
    assert.ok(wasNextCalled());
    assert.strictEqual(req.user.id, 'user456');
  });

  it('returns 401 when no token is provided', async () => {
    const { req, res, next, getStatus, getJson, wasNextCalled } = createMocks();
    await protect(req, res, next);
    assert.strictEqual(wasNextCalled(), false);
    assert.strictEqual(getStatus(), 401);
    assert.strictEqual(getJson().success, false);
    assert.ok(getJson().message.includes('token missing'));
  });

  it('returns 401 for an invalid token', async () => {
    const { req, res, next, getStatus, wasNextCalled } = createMocks('Bearer invalid.token.here');
    await protect(req, res, next);
    assert.strictEqual(wasNextCalled(), false);
    assert.strictEqual(getStatus(), 401);
  });

  it('returns 401 for an expired token', async () => {
    const token = jwt.sign({ id: 'u', email: 'e' }, TEST_SECRET, { expiresIn: '0s' });
    // Small delay to ensure token is expired
    await new Promise((r) => setTimeout(r, 50));
    const { req, res, next, getStatus, wasNextCalled } = createMocks(`Bearer ${token}`);
    await protect(req, res, next);
    assert.strictEqual(wasNextCalled(), false);
    assert.strictEqual(getStatus(), 401);
  });

  it('prefers Bearer header over cookie', async () => {
    const headerToken = jwt.sign({ id: 'header-user', email: 'h@b.com' }, TEST_SECRET);
    const cookieToken = jwt.sign({ id: 'cookie-user', email: 'c@b.com' }, TEST_SECRET);
    const { req, res, next, wasNextCalled } = createMocks(`Bearer ${headerToken}`, cookieToken);
    await protect(req, res, next);
    assert.ok(wasNextCalled());
    assert.strictEqual(req.user.id, 'header-user');
  });
});
