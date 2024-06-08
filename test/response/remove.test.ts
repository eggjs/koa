import assert from 'node:assert';
import context from '../test-helpers/context.js';

describe('ctx.remove(name)', () => {
  it('should remove a field', () => {
    const ctx = context();
    ctx.set('x-foo', 'bar');
    ctx.remove('x-foo');
    assert.deepStrictEqual(ctx.response.header, {});
  });
});
