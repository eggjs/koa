import assert from 'node:assert';
import { request } from '../test-helpers/context';

describe('req.URL', () => {
  it('should not throw when host is void', () => {
    // Accessing the URL should not throw.
    request().URL;
  });

  it('should not throw when header.host is invalid', () => {
    const req = request();
    req.header.host = 'invalid host';
    // Accessing the URL should not throw.
    req.URL;
  });

  it('should return empty object when invalid', () => {
    const req = request();
    req.header.host = 'invalid host';
    assert.deepStrictEqual(req.URL, Object.create(null));
  });
});
