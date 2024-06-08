import assert from 'node:assert';
import context from '../test-helpers/context.js';

describe('ctx.assert(value, status)', () => {
  it('should throw an error', () => {
    const ctx = context();

    try {
      ctx.assert(false, 404);
      throw new Error('asdf');
    } catch (err: any) {
      assert.strictEqual(err.message, 'Not Found');
      assert.strictEqual(err.status, 404);
      assert.strictEqual(err.expose, true);
    }

    try {
      ctx.assert(false, 401, 'Please login!');
      throw new Error('asdf');
    } catch (err: any) {
      assert.strictEqual(err.message, 'Please login!');
      assert.strictEqual(err.status, 401);
      assert.strictEqual(err.expose, true);
    }
  });
});
