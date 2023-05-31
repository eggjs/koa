import Stream from 'node:stream';
import assert from 'node:assert';
import { response } from '../test-helpers/context';

describe('res.socket', () => {
  it('should return the request socket object', () => {
    const res = response();
    assert.strictEqual(res.socket instanceof Stream, true);
  });
});
