import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { response } from '../test-helpers/context.ts';

describe('res.lastModified', () => {
  it('should set the header as a UTCString', () => {
    const res = response();
    const date = new Date();
    res.lastModified = date;
    assert.strictEqual(res.header['last-modified'], date.toUTCString());
  });

  it('should work with date strings', () => {
    const res = response();
    const date = new Date();
    res.lastModified = date.toString();
    assert.strictEqual(res.header['last-modified'], date.toUTCString());
  });

  it('should get the header as a Date', () => {
    // Note: Date() removes milliseconds, but it's practically important.
    const res = response();
    const date = new Date();
    res.lastModified = date;
    assert.strictEqual(
      res.lastModified.getTime() / 1000,
      Math.floor(date.getTime() / 1000)
    );
  });

  describe('when lastModified not set', () => {
    it('should get undefined', () => {
      const res = response();
      assert.strictEqual(res.lastModified, undefined);
    });
  });
});
