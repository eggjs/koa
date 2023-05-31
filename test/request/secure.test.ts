import assert from 'node:assert';
import { request } from '../../test-helpers/context';

describe('req.secure', () => {
  it('should return true when encrypted', () => {
    const req = request();
    req.req.socket = { encrypted: true };
    assert.strictEqual(req.secure, true);
  });
});
