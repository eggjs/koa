
const assert = require('node:assert');
const request = require('supertest');
const Koa = require('../..');

describe('app.request', () => {
  const app1 = new Koa();
  app1.request.message = 'hello';
  const app2 = new Koa();

  it('should merge properties', () => {
    app1.use(ctx => {
      assert.strictEqual(ctx.request.message, 'hello');
      ctx.status = 204;
    });

    return request(app1.listen())
      .get('/')
      .expect(204);
  });

  it('should not affect the original prototype', () => {
    app2.use(ctx => {
      assert.strictEqual(ctx.request.message, undefined);
      ctx.status = 204;
    });

    return request(app2.listen())
      .get('/')
      .expect(204);
  });
});
