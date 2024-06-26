import assert from 'node:assert';
import { response } from '../test-helpers/context.js';

describe('res.header', () => {
  it('should return the response header object', () => {
    const res = response();
    res.set('X-Foo', 'bar');
    assert.deepStrictEqual(res.headers, { 'x-foo': 'bar' });
  });

  describe('when res._headers not present', () => {
    it('should return empty object', () => {
      const res = response();
      (res.res as any)._headers = null;
      assert.deepStrictEqual(res.headers, {});
    });
  });
});
