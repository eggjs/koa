import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { request } from '../test-helpers/context.ts';

describe('req.ips', () => {
  describe('when X-Forwarded-For is present', () => {
    describe('and proxy is not trusted', () => {
      it('should be ignored', () => {
        const req = request();
        req.app.proxy = false;
        req.header['x-forwarded-for'] = '127.0.0.1,127.0.0.2';
        assert.deepStrictEqual(req.ips, []);
      });
    });

    describe('and proxy is trusted', () => {
      it('should be used', () => {
        let req = request();
        req.app.proxy = true;
        req.header['x-forwarded-for'] = '127.0.0.1,127.0.0.2';
        assert.deepStrictEqual(req.ips, ['127.0.0.1', '127.0.0.2']);

        req = request();
        req.app.proxy = true;
        req.header['x-forwarded-for'] = '127.0.0.1,  ,  ,,,,127.0.0.2';
        assert.deepStrictEqual(req.ips, ['127.0.0.1', '127.0.0.2']);
      });

      it('should ignore invalid ips', () => {
        const req = request();
        req.app.proxy = true;
        req.header['x-forwarded-for'] = ',  ,  ,,,,   , ,,,  ,';
        assert.deepStrictEqual(req.ips, []);
      });
    });
  });

  describe('when options.proxyIpHeader is present', () => {
    describe('and proxy is not trusted', () => {
      it('should be ignored', () => {
        const req = request();
        req.app.proxy = false;
        req.app.proxyIpHeader = 'x-client-ip';
        req.header['x-client-ip'] = '127.0.0.1,127.0.0.2';
        assert.deepStrictEqual(req.ips, []);
      });
    });

    describe('and proxy is trusted', () => {
      it('should be used', () => {
        const req = request();
        req.app.proxy = true;
        req.app.proxyIpHeader = 'x-client-ip';
        req.header['x-client-ip'] = '127.0.0.1,127.0.0.2';
        assert.deepStrictEqual(req.ips, ['127.0.0.1', '127.0.0.2']);
      });
    });
  });

  describe('when options.maxIpsCount is present', () => {
    describe('and proxy is not trusted', () => {
      it('should be ignored', () => {
        const req = request();
        req.app.proxy = false;
        req.app.maxIpsCount = 1;
        req.header['x-forwarded-for'] = '127.0.0.1,127.0.0.2';
        assert.deepStrictEqual(req.ips, []);
      });
    });

    describe('and proxy is trusted', () => {
      it('should be used', () => {
        const req = request();
        req.app.proxy = true;
        req.app.maxIpsCount = 1;
        req.header['x-forwarded-for'] = '127.0.0.1,127.0.0.2';
        assert.deepStrictEqual(req.ips, ['127.0.0.2']);
      });
    });
  });
});
