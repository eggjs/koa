import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { request } from '../test-helpers/context.ts';

describe('req.hostname', () => {
  it('should return hostname void of port', () => {
    const req = request();
    req.header.host = 'foo.com:3000';
    assert.strictEqual(req.hostname, 'foo.com');
  });

  describe('with no host present', () => {
    it('should return ""', () => {
      const req = request();
      assert.strictEqual(req.hostname, '');
    });
  });

  describe('with IPv6 in host', () => {
    it('should parse localhost void of port', () => {
      const req = request();
      req.header.host = '[::1]';
      assert.strictEqual(req.hostname, '[::1]');
    });

    it('should parse localhost with port 80', () => {
      const req = request();
      req.header.host = '[::1]:80';
      assert.strictEqual(req.hostname, '[::1]');
    });

    it('should parse localhost with non-special schema port', () => {
      const req = request();
      req.header.host = '[::1]:1337';
      assert.strictEqual(req.hostname, '[::1]');
    });

    it('should reduce IPv6 with non-special schema port as hostname', () => {
      const req = request();
      req.header.host = '[2001:cdba:0000:0000:0000:0000:3257:9652]:1337';
      assert.strictEqual(req.hostname, '[2001:cdba::3257:9652]');
    });

    it('should return empty string when invalid', () => {
      const req = request();
      req.header.host = '[invalidIPv6]';
      assert.strictEqual(req.hostname, '');
    });
  });

  describe('when X-Forwarded-Host is present', () => {
    describe('and proxy is not trusted', () => {
      it('should be ignored', () => {
        const req = request();
        req.header['x-forwarded-host'] = 'bar.com';
        req.header.host = 'foo.com';
        assert.strictEqual(req.hostname, 'foo.com');
      });
    });

    describe('and proxy is trusted', () => {
      it('should be used', () => {
        const req = request();
        req.app.proxy = true;
        req.header['x-forwarded-host'] = 'bar.com, baz.com';
        req.header.host = 'foo.com';
        assert.strictEqual(req.hostname, 'bar.com');
      });
    });
  });
});
