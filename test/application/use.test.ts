import assert from 'node:assert';
import request from 'supertest';
import Koa from '../../src/index.js';

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

  it('should throw error on generator middleware', () => {
    const app = new Koa();

    app.use((_ctx, next) => next());
    assert.throws(() => {
      app.use((function* generatorMiddileware(_ctx: any, next: any) {
        console.log('pre generator');
        yield next;
        // this.body = 'generator';
        console.log('post generator');
      }) as any);
    }, (err: TypeError) => {
      assert.match(err.message, /Support for generators was removed/);
      return true;
    });
  });

  it('should throw error for non-function', () => {
    const app = new Koa();

    [ null, undefined, 0, false, 'not a function' ].forEach(v => {
      assert.throws(() => app.use(v as any), /middleware must be a function!/);
    });
  });

  it('should remove generator functions support', () => {
    const app = new Koa();
    assert.throws(() => {
      app.use((function* () {
        // empty
      }) as any);
    }, /Support for generators was removed/);
  });
});
