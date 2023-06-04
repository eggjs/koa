import assert from 'node:assert';
import request from 'supertest';
import Koa from '../..';

describe('app.use(fn)', () => {
  it('should compose middleware', async () => {
    const app = new Koa();
    const calls: number[] = [];

    app.use((_ctx, next) => {
      calls.push(1);
      return next().then(() => {
        calls.push(6);
      });
    });

    app.use((_ctx, next) => {
      calls.push(2);
      return next().then(() => {
        calls.push(5);
      });
    });

    app.use((_ctx, next) => {
      calls.push(3);
      return next().then(() => {
        calls.push(4);
      });
    });

    const server = app.listen();

    await request(server)
      .get('/')
      .expect(404);

    assert.deepStrictEqual(calls, [ 1, 2, 3, 4, 5, 6 ]);
  });

  it('should compose mixed middleware', async () => {
    process.once('deprecation', () => {}); // silence deprecation message
    const app = new Koa();
    const calls: number[] = [];

    app.use((_ctx, next) => {
      calls.push(1);
      return next().then(() => {
        calls.push(6);
      });
    });

    app.use(async (_ctx, next) => {
      calls.push(2);
      await next();
      calls.push(5);
    });

    app.use((_ctx, next) => {
      calls.push(3);
      return next().then(() => {
        calls.push(4);
      });
    });

    const server = app.listen();

    await request(server)
      .get('/')
      .expect(404);

    assert.deepStrictEqual(calls, [ 1, 2, 3, 4, 5, 6 ]);
  });

  // https://github.com/koajs/koa/pull/530#issuecomment-148138051
  it('should catch thrown errors in non-async functions', () => {
    const app = new Koa();

    app.use(ctx => ctx.throw('Not Found', 404));

    return request(app.callback())
      .get('/')
      .expect(404);
  });

  it('should accept both generator and function middleware', () => {
    // process.once('deprecation', () => {
    //   // ignore
    // }); // silence deprecation message
    const app = new Koa();

    app.use((_ctx, next) => next());
    app.use((function* (ctx) {
      ctx.body = 'generator';
    }) as any);

    return request(app.callback())
      .get('/')
      .expect(200)
      .expect('generator');
  });

  it('should throw error for non-function', () => {
    const app = new Koa();

    [ null, undefined, 0, false, 'not a function' ].forEach(v => {
      assert.throws(() => app.use(v as any), /middleware must be a function!/);
    });
  });

  it('should output deprecation message for generator functions', done => {
    process.once('deprecation', err => {
      assert.match(err.message, /Support for generators will be removed/);
      done();
    });

    const app = new Koa();
    app.use((function* () {
      // empty
    }) as any);
  });
});
