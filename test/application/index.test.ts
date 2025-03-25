import assert from 'node:assert/strict';
import type { ServerResponse, IncomingMessage } from 'node:http';

import request from 'supertest';
import createHttpError, { HttpError } from 'http-errors';

import Koa from '../../src/index.js';

describe('app', () => {
  it('should handle socket errors', done => {
    const app = new Koa();

    app.use(ctx => {
      // triggers ctx.socket.writable == false
      ctx.socket.emit('error', new Error('boom'));
    });

    app.on('error', err => {
      assert.strictEqual(err.message, 'boom');
      done();
    });

    request(app.callback())
      .get('/')
      .end(() => {
        // empty
      });
  });

  it('should emit request and response event', done => {
    const app = new Koa();
    let requestCount = 0;
    let responseCount = 0;
    app.on('request', ctx => {
      assert.equal(ctx.url, '/');
      requestCount++;
    });
    app.on('response', ctx => {
      assert.equal(ctx.url, '/');
      assert.equal(ctx.status, 404);
      responseCount++;
      if (responseCount === 2) {
        assert.equal(requestCount, 2);
        done();
      }
    });

    request(app.callback())
      .get('/')
      .end(() => {
        // empty
      });
    request(app.callback())
      .get('/')
      .end(() => {
        // empty
      });
  });

  it('should not .writeHead when !socket.writable', done => {
    const app = new Koa();

    app.use(ctx => {
      // set .writable to false
      (ctx.socket as unknown as { writable: boolean }).writable = false;
      ctx.status = 204;
      // throw if .writeHead or .end is called
      ctx.res.writeHead = () => {
        throw new Error('response sent (writeHead)');
      };
      ctx.res.end = () => {
        throw new Error('response sent (end)');
      };
    });

    // hackish, but the response should occur in a single tick
    setImmediate(done);

    request(app.callback())
      .get('/')
      .end(() => {
        // empty
      });
  });

  it('should set development env when NODE_ENV missing', () => {
    const NODE_ENV = process.env.NODE_ENV;
    process.env.NODE_ENV = '';
    const app = new Koa();
    process.env.NODE_ENV = NODE_ENV;
    assert.strictEqual(app.env, 'development');
  });

  it('should set env from the constructor', () => {
    const env = 'custom';
    const app = new Koa({ env });
    assert.strictEqual(app.env, env);
  });

  it('should set proxy flag from the constructor', () => {
    const proxy = true;
    const app = new Koa({ proxy });
    assert.strictEqual(app.proxy, proxy);
  });

  it('should set signed cookie keys from the constructor', () => {
    const keys = ['customkey'];
    const app = new Koa({ keys });
    assert.strictEqual(app.keys, keys);
  });

  it('should set subdomainOffset from the constructor', () => {
    const subdomainOffset = 3;
    const app = new Koa({ subdomainOffset });
    assert.strictEqual(app.subdomainOffset, subdomainOffset);
  });

  it('should have a static property exporting `HttpError` from http-errors library', () => {
    assert.notEqual(Koa.HttpError, undefined);
    assert.equal(Koa.HttpError, HttpError);
    assert.throws(() => {
      throw createHttpError(500, 'test error');
    }, Koa.HttpError);
  });

  it('should print object works', () => {
    const app = new Koa();
    const ctx = app.createContext(
      {} as unknown as IncomingMessage,
      {
        getHeaders() {
          return {};
        },
      } as unknown as ServerResponse
    );
    console.log(ctx.request);
    console.log(ctx.response);
    console.log(ctx.context);
    console.log(app);
  });
});
