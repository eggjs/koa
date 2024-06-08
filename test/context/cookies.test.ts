import assert from 'node:assert';
import request from 'supertest';
import Koa from '../../src/index.js';

describe('ctx.cookies', () => {
  describe('ctx.cookies.set()', () => {
    it('should set an unsigned cookie', async () => {
      const app = new Koa();

      app.use((ctx: any) => {
        ctx.cookies.set('name', 'jon');
        ctx.status = 204;
      });

      const server = app.listen();

      const res = await request(server)
        .get('/')
        .expect(204);

      let cookies = res.headers['set-cookie'];
      if (Array.isArray(cookies)) {
        cookies = cookies.join(',');
      }
      const cookie = /^name=/.test(cookies);
      assert.strictEqual(cookie, true);
    });

    describe('with .signed', () => {
      describe('when no .keys are set', () => {
        it('should error', () => {
          const app = new Koa();

          app.use((ctx: any) => {
            try {
              ctx.cookies.set('foo', 'bar', { signed: true });
            } catch (err: any) {
              ctx.body = err.message;
            }
          });

          return request(app.callback())
            .get('/')
            .expect('.keys required for signed cookies');
        });
      });

      it('should send a signed cookie', async () => {
        const app = new Koa();

        app.keys = [ 'a', 'b' ];

        app.use((ctx: any) => {
          ctx.cookies.set('name', 'jon', { signed: true });
          ctx.status = 204;
        });

        const server = app.listen();

        const res = await request(server)
          .get('/')
          .expect(204);

        let cookies = res.headers['set-cookie'];
        if (Array.isArray(cookies)) {
          cookies = cookies.join(',');
        }
        assert.strictEqual(/^name=/.test(cookies), true);
        assert.strictEqual(/(,|^)name\.sig=/.test(cookies), true);
      });
    });

    describe('with secure', () => {
      it('should get secure from request', async () => {
        const app = new Koa();

        app.proxy = true;
        app.keys = [ 'a', 'b' ];

        app.use(ctx => {
          ctx.cookies.set('name', 'jon', { signed: true });
          ctx.status = 204;
        });

        const server = app.listen();

        const res = await request(server)
          .get('/')
          .set('x-forwarded-proto', 'https') // mock secure
          .expect(204);

        let cookies = res.headers['set-cookie'];
        if (Array.isArray(cookies)) {
          cookies = cookies.join(',');
        }
        assert.strictEqual(/^name=/.test(cookies), true);
        assert.strictEqual(/(,|^)name\.sig=/.test(cookies), true);
        assert.strictEqual(/secure/.test(cookies), true);
      });
    });
  });

  describe('ctx.cookies=', () => {
    it('should override cookie work', async () => {
      const app = new Koa();

      app.use((ctx: any) => {
        ctx.cookies = {
          set(key: string, value: string) {
            ctx.set(key, value);
          },
        };
        ctx.cookies.set('name', 'jon');
        ctx.status = 204;
      });

      const server = app.listen();

      await request(server)
        .get('/')
        .expect('name', 'jon')
        .expect(204);
    });
  });
});
