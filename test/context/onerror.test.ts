import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ServerResponse } from 'node:http';
import { runInNewContext } from 'node:vm';

import request from 'supertest';

import Koa, { type Context } from '../../src/index.ts';
import context from '../test-helpers/context.ts';

describe('ctx.onerror(err)', () => {
  it('should respond', () => {
    const app = new Koa();

    app.use((ctx: Context) => {
      ctx.body = 'something else';

      ctx.throw(418, 'boom');
    });

    const server = app.listen();

    return request(server)
      .get('/')
      .expect(418)
      .expect('Content-Type', 'text/plain; charset=utf-8')
      .expect('Content-Length', '4');
  });

  it('should unset all headers', async () => {
    const app = new Koa();

    app.use((ctx: Context) => {
      ctx.set('Vary', 'Accept-Encoding');
      ctx.set('X-CSRF-Token', 'asdf');
      ctx.body = 'response';

      ctx.throw(418, 'boom');
    });

    const server = app.listen();

    const res = await request(server)
      .get('/')
      .expect(418)
      .expect('Content-Type', 'text/plain; charset=utf-8')
      .expect('Content-Length', '4');

    assert.equal(Object.hasOwn(res.headers, 'vary'), false);
    assert.equal(Object.hasOwn(res.headers, 'x-csrf-token'), false);
  });

  it('should set headers specified in the error', async () => {
    const app = new Koa();

    app.use((ctx: Context) => {
      ctx.set('Vary', 'Accept-Encoding');
      ctx.set('X-CSRF-Token', 'asdf');
      ctx.body = 'response';

      throw Object.assign(new Error('boom'), {
        status: 418,
        expose: true,
        headers: {
          'X-New-Header': 'Value',
        },
      });
    });

    const server = app.listen();

    const res = await request(server)
      .get('/')
      .expect(418)
      .expect('Content-Type', 'text/plain; charset=utf-8')
      .expect('X-New-Header', 'Value');

    assert.equal(Object.hasOwn(res.headers, 'vary'), false);
    assert.equal(Object.hasOwn(res.headers, 'x-csrf-token'), false);
  });

  it.skip('should ignore error after headerSent', done => {
    const app = new Koa();

    app.on('error', err => {
      assert.strictEqual(err.message, 'mock error');
      assert.strictEqual(err.headerSent, true);
      done();
    });

    app.use(async (ctx: Context) => {
      ctx.status = 200;
      ctx.set('X-Foo', 'Bar');
      ctx.flushHeaders();
      await Promise.reject(new Error('mock error'));
      ctx.body = 'response';
    });

    request(app.callback()).get('/').expect('X-Foo', 'Bar').expect(200);
  });

  it('should set status specified in the error using statusCode', () => {
    const app = new Koa();

    app.use((ctx: Context) => {
      ctx.body = 'something else';
      const err = new Error('Not found');
      (err as unknown as { statusCode: number }).statusCode = 404;
      throw err;
    });

    const server = app.listen();

    return request(server)
      .get('/')
      .expect(404)
      .expect('Content-Type', 'text/plain; charset=utf-8')
      .expect('Not Found');
  });

  describe('when invalid err.statusCode', () => {
    describe('not number', () => {
      it('should respond 500', () => {
        const app = new Koa();

        app.use((ctx: Context) => {
          ctx.body = 'something else';
          const err = new Error('some error');
          (err as unknown as { statusCode: string }).statusCode = 'notnumber';
          throw err;
        });

        const server = app.listen();

        return request(server)
          .get('/')
          .expect(500)
          .expect('Content-Type', 'text/plain; charset=utf-8')
          .expect('Internal Server Error');
      });
    });
  });

  describe('when invalid err.status', () => {
    describe('not number', () => {
      it('should respond 500', () => {
        const app = new Koa();

        app.use((ctx: Context) => {
          ctx.body = 'something else';
          const err = new Error('some error');
          (err as unknown as { status: string }).status = 'notnumber';
          throw err;
        });

        const server = app.listen();

        return request(server)
          .get('/')
          .expect(500)
          .expect('Content-Type', 'text/plain; charset=utf-8')
          .expect('Internal Server Error');
      });
    });
    describe('when ENOENT error', () => {
      it('should respond 404', () => {
        const app = new Koa();

        app.use((ctx: Context) => {
          ctx.body = 'something else';
          const err = new Error('test for ENOENT');
          (err as unknown as { code: string }).code = 'ENOENT';
          throw err;
        });

        const server = app.listen();

        return request(server)
          .get('/')
          .expect(404)
          .expect('Content-Type', 'text/plain; charset=utf-8')
          .expect('Not Found');
      });
    });
    describe('not http status code', () => {
      it('should respond 500', () => {
        const app = new Koa();

        app.use((ctx: Context) => {
          ctx.body = 'something else';
          const err = new Error('some error');
          (err as unknown as { status: number }).status = 9999;
          throw err;
        });

        const server = app.listen();

        return request(server)
          .get('/')
          .expect(500)
          .expect('Content-Type', 'text/plain; charset=utf-8')
          .expect('Internal Server Error');
      });
    });
  });

  describe('when error from another scope thrown', () => {
    it('should handle it like a normal error', async () => {
      const ExternError = runInNewContext('Error');
      const app = new Koa();
      const error = Object.assign(new ExternError('boom'), {
        status: 418,
        expose: true,
      });
      app.use(() => {
        throw error;
      });

      const server = app.listen();

      // oxlint-disable-next-line promise/avoid-new
      const gotRightErrorPromise = new Promise<void>((resolve, reject) => {
        app.on('error', receivedError => {
          try {
            assert.strictEqual(receivedError, error);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });

      await request(server).get('/').expect(418);

      await gotRightErrorPromise;
    });
  });

  describe('when non-error thrown', () => {
    it('should respond with non-error thrown message', () => {
      const app = new Koa();

      app.use(() => {
        throw 'string error'; // eslint-disable-line no-throw-literal
      });

      const server = app.listen();

      return request(server)
        .get('/')
        .expect(500)
        .expect('Content-Type', 'text/plain; charset=utf-8')
        .expect('Internal Server Error');
    });

    it('should use res.getHeaderNames() accessor when available', () => {
      let removed = 0;
      const ctx = context();

      (ctx.app as unknown as { emit: () => void }).emit = () => {
        // ignore
      };
      ctx.res = {
        getHeaderNames: () => ['content-type', 'content-length'],
        removeHeader: () => removed++,
        end: () => {
          // ignore
        },
        emit: () => {
          // ignore
        },
      } as unknown as ServerResponse;

      ctx.onerror(new Error('error'));

      assert.strictEqual(removed, 2);
    });

    it('should stringify error if it is an object', done => {
      const app = new Koa();

      app.on('error', err => {
        assert.strictEqual(err.message, 'non-error thrown: {"key":"value"}');
        done();
      });

      app.use(async () => {
        throw { key: 'value' }; // eslint-disable-line no-throw-literal
      });

      request(app.callback())
        .get('/')
        .expect(500)
        .expect('Internal Server Error', () => {
          // ignore
        });
    });
  });
});
