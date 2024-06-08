import Stream from 'node:stream';
import assert from 'node:assert';
import context from '../test-helpers/context.js';

describe('ctx.origin', () => {
  it('should return the origin of url', () => {
    const socket = new Stream.Duplex();
    const req = {
      url: '/users/1?next=/dashboard',
      headers: {
        host: 'localhost',
      },
      socket,
      __proto__: Stream.Readable.prototype,
    };
    const ctx = context(req);
    assert.strictEqual(ctx.origin, 'http://localhost');
    // change it also work
    ctx.url = '/foo/users/1?next=/dashboard';
    assert.strictEqual(ctx.origin, 'http://localhost');
  });
});
