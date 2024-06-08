import assert from 'node:assert';
import request from 'supertest';
import Koa from '../../src/index.js';

describe('ctx.state', () => {
  it('should provide a ctx.state namespace', () => {
    const app = new Koa();

    app.use(ctx => {
      assert.deepStrictEqual(ctx.state, {});
    });

    const server = app.listen();

    return request(server)
      .get('/')
      .expect(404);
  });
});
