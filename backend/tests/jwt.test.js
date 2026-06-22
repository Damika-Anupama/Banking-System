/**
 * Unit tests for JWT token creation and verification logic
 * (mirrors the createJWT helper in routes/user.router.js).
 *
 * No database or network required — isolates the token contract:
 * - Token is a valid JWT signed with HS256
 * - Payload carries user_id
 * - Token expires (exp claim present)
 * - A different secret fails verification (tamper resistance)
 *
 * Run: npx jest tests/jwt.test.js
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'test-secret-unit';

/** Mirrors the production createJWT function in routes/user.router.js */
function createJWT(user) {
  return jwt.sign({ user_id: user.user_id }, JWT_SECRET, {
    expiresIn: '2h',
    algorithm: 'HS256',
  });
}

describe('createJWT', () => {
  test('returns a three-segment JWT string', () => {
    const token = createJWT({ user_id: 42 });
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  test('payload contains the correct user_id', () => {
    const token = createJWT({ user_id: 99 });
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    expect(decoded.user_id).toBe(99);
  });

  test('token carries an expiry claim approximately 2h from now', () => {
    const before = Math.floor(Date.now() / 1000);
    const token = createJWT({ user_id: 1 });
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    const expectedExp = before + 7200; // 2h in seconds
    expect(decoded.exp).toBeGreaterThanOrEqual(expectedExp - 5); // 5s tolerance
    expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 5);
  });

  test('algorithm is HS256 (header alg field)', () => {
    const token = createJWT({ user_id: 7 });
    const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString());
    expect(header.alg).toBe('HS256');
  });

  test('different user_ids produce different tokens', () => {
    const t1 = createJWT({ user_id: 1 });
    const t2 = createJWT({ user_id: 2 });
    expect(t1).not.toBe(t2);
  });

  test('tampered token (wrong secret) fails verification', () => {
    const token = createJWT({ user_id: 10 });
    expect(() => {
      jwt.verify(token, 'wrong-secret', { algorithms: ['HS256'] });
    }).toThrow(jwt.JsonWebTokenError);
  });

  test('expired token is rejected', async () => {
    const expiredToken = jwt.sign({ user_id: 5 }, JWT_SECRET, {
      expiresIn: '1ms',
      algorithm: 'HS256',
    });
    // Wait a tick to guarantee expiry
    await new Promise((r) => setTimeout(r, 10));
    expect(() => {
      jwt.verify(expiredToken, JWT_SECRET, { algorithms: ['HS256'] });
    }).toThrow(jwt.TokenExpiredError);
  });
});
