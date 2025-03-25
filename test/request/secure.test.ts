import assert from 'node:assert/strict';

import { request } from '../test-helpers/context.js';

describe('req.secure', () => {
  it('should return true when encrypted', () => {
    const req = request();
    // @ts-expect-error for testing
    req.req.socket = { encrypted: true };
    assert.equal(req.secure, true);
  });
});
