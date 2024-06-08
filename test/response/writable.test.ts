import net from 'node:net';
import assert from 'node:assert';
import { setTimeout as sleep } from 'node:timers/promises';
import Koa from '../../src/index.js';

describe('res.writable', () => {
  describe('when continuous requests in one persistent connection', () => {
    function requestTwice(server: any, done: any) {
      const port = server.address().port;
      const buf = Buffer.from('GET / HTTP/1.1\r\nHost: localhost:' + port + '\r\nConnection: keep-alive\r\n\r\n');
      const client = net.connect(port);
      const datas: Buffer[] = [];
      client
        .on('error', done)
        .on('data', data => datas.push(data))
        .on('end', () => done(null, datas));
      setImmediate(() => client.write(buf));
      setImmediate(() => client.write(buf));
      setTimeout(() => client.end(), 100);
    }

    it('should always be writable and respond to all requests', done => {
      const app = new Koa();
      let count = 0;
      app.use(ctx => {
        count++;
        ctx.body = 'request ' + count + ', writable: ' + ctx.writable;
      });

      const server = app.listen();
      requestTwice(server, (_: any, datas: Buffer[]) => {
        const responses = Buffer.concat(datas).toString();
        assert.strictEqual(/request 1, writable: true/.test(responses), true);
        assert.strictEqual(/request 2, writable: true/.test(responses), true);
        done();
      });
    });
  });

  describe('when socket closed before response sent', () => {
    function requestClosed(server: any) {
      const port = server.address().port;
      const buf = Buffer.from('GET / HTTP/1.1\r\nHost: localhost:' + port + '\r\nConnection: keep-alive\r\n\r\n');
      const client = net.connect(port);
      setImmediate(() => {
        client.write(buf);
        client.end();
      });
    }

    it('should not be writable', done => {
      const app = new Koa();
      app.use(ctx => {
        sleep(1000)
          .then(() => {
            if (ctx.writable) return done(new Error('ctx.writable should not be true'));
            done();
          });
      });
      const server = app.listen();
      requestClosed(server);
    });
  });

  describe('when response finished', () => {
    function request(server: any) {
      const port = server.address().port;
      const buf = Buffer.from('GET / HTTP/1.1\r\nHost: localhost:' + port + '\r\nConnection: keep-alive\r\n\r\n');
      const client = net.connect(port);
      setImmediate(() => {
        client.write(buf);
      });
      setTimeout(() => {
        client.end();
      }, 100);
    }

    it('should not be writable', done => {
      const app = new Koa();
      app.use(ctx => {
        ctx.res.end();
        if (ctx.writable) return done(new Error('ctx.writable should not be true'));
        done();
      });
      const server = app.listen();
      request(server);
    });
  });
});
