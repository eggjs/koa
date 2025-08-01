import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import context from '../test-helpers/context.ts';

describe('ctx.response.has(name)', () => {
  it('should check a field value, case insensitive way', () => {
    const ctx = context();
    ctx.set('X-Foo', '');
    assert.ok(ctx.response.has('x-Foo'));
    assert.ok(ctx.has('x-foo'));
  });

  it('should return false for non-existent header', () => {
    const ctx = context();
    assert.strictEqual(ctx.response.has('boo'), false);
    ctx.set('x-foo', 5);
    assert.strictEqual(ctx.has('x-boo'), false);
  });
});
