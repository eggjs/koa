import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import request from 'supertest';

import Koa from '../../src/index.ts';

describe('app.response', () => {
  const app1 = new Koa();
  app1.response.msg = 'hello';
  const app2 = new Koa();
  const app3 = new Koa();
  const app4 = new Koa();
  const app5 = new Koa();

  it('should merge properties', () => {
    app1.use(ctx => {
      assert.strictEqual(ctx.response.msg, 'hello');
      ctx.status = 204;
    });

    return request(app1.listen()).get('/').expect(204);
  });

  it('should not affect the original prototype', () => {
    app2.use(ctx => {
      assert.strictEqual(ctx.response.msg, undefined);
      ctx.status = 204;
    });

    return request(app2.listen()).get('/').expect(204);
  });

  it('should not include status message in body for http2', async () => {
    app3.use(ctx => {
      ctx.req.httpVersionMajor = 2;
      ctx.status = 404;
    });
    const response = await request(app3.listen()).get('/').expect(404);
    assert.strictEqual(response.text, '404');
  });

  it('should set ._explicitNullBody correctly', async () => {
    app4.use(ctx => {
      ctx.body = null;
      assert.strictEqual(ctx.response._explicitNullBody, true);
    });

    return request(app4.listen()).get('/').expect(204);
  });

  it('should not set ._explicitNullBody incorrectly', async () => {
    app5.use(ctx => {
      ctx.body = undefined;
      assert.strictEqual(ctx.response._explicitNullBody, undefined);
      ctx.body = '';
      assert.strictEqual(ctx.response._explicitNullBody, undefined);
      ctx.body = false;
      assert.strictEqual(ctx.response._explicitNullBody, undefined);
    });

    return request(app5.listen()).get('/').expect(204);
  });
});
