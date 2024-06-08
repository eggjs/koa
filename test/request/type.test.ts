import assert from 'node:assert';
import { request } from '../test-helpers/context.js';

describe('req.type', () => {
  it('should return type void of parameters', () => {
    const req = request();
    req.header['content-type'] = 'text/html; charset=utf-8';
    assert.strictEqual(req.type, 'text/html');
  });

  it('should return empty string with no host present', () => {
    const req = request();
    assert.strictEqual(req.type, '');
  });
});
