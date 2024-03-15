import assert from 'node:assert';
import request from 'supertest';
import context from '../test-helpers/context';
import Koa from '../..';

describe('ctx.redirect(url)', () => {
  it('should redirect to the given url', () => {
    const ctx = context();
    ctx.redirect('http://google.com');
    assert.strictEqual(ctx.response.header.location, 'http://google.com/');
    assert.strictEqual(ctx.status, 302);
  });

  it('should url formatting is required before redirect', () => {
    const ctx = context();
    ctx.redirect('http://google.com\\@baidu.com');
    assert.strictEqual(ctx.response.header.location, 'http://google.com/@baidu.com');
    assert.strictEqual(ctx.status, 302);
  });

  it('should auto fix not encode url', done => {
    const app = new Koa();

    app.use(ctx => {
      ctx.redirect('https://google.com/😓?hello=你好(*´▽｀)ノノ&p=123&q=%F0%9F%98%93%3Fhello%3D%E4%BD%A0%E5%A5%BD%28');
    });

    request(app.callback())
      .get('/')
      .end((err, res) => {
        if (err) return done(err);
        assert.strictEqual(res.status, 302);
        assert.strictEqual(res.headers.location, 'https://google.com/%F0%9F%98%93?hello=%E4%BD%A0%E5%A5%BD(*%C2%B4%E2%96%BD%EF%BD%80)%E3%83%8E%E3%83%8E&p=123&q=%F0%9F%98%93%3Fhello%3D%E4%BD%A0%E5%A5%BD%28');
        done();
      });
  });

  describe('with "back"', () => {
    it('should redirect to Referrer', () => {
      const ctx = context();
      ctx.req.headers.referrer = '/login';
      ctx.redirect('back');
      assert.strictEqual(ctx.response.header.location, '/login');
    });

    it('should redirect to Referer', () => {
      const ctx = context();
      ctx.req.headers.referer = '/login';
      ctx.redirect('back');
      assert.strictEqual(ctx.response.header.location, '/login');
    });

    it('should default to alt', () => {
      const ctx = context();
      ctx.redirect('back', '/index.html');
      assert.strictEqual(ctx.response.header.location, '/index.html');
    });

    it('should default redirect to /', () => {
      const ctx = context();
      ctx.redirect('back');
      assert.strictEqual(ctx.response.header.location, '/');
    });
  });

  describe('when html is accepted', () => {
    it('should respond with html', () => {
      const ctx = context();
      const url = 'http://google.com';
      ctx.header.accept = 'text/html';
      ctx.redirect(url);
      assert.strictEqual(ctx.response.header['content-type'], 'text/html; charset=utf-8');
      assert.strictEqual(ctx.body, `Redirecting to <a href="${url}/">${url}/</a>.`);
    });

    it('should escape the url', () => {
      const ctx = context();
      let url = '<script>';
      ctx.header.accept = 'text/html';
      ctx.redirect(url);
      url = escape(url);
      assert.strictEqual(ctx.response.header['content-type'], 'text/html; charset=utf-8');
      assert.strictEqual(ctx.body, `Redirecting to <a href="${url}">${url}</a>.`);
    });
  });

  describe('when text is accepted', () => {
    it('should respond with text', () => {
      const ctx = context();
      const url = 'http://google.com';
      ctx.header.accept = 'text/plain';
      ctx.redirect(url);
      assert.strictEqual(ctx.body, `Redirecting to ${url}/.`);
    });
  });

  describe('when status is 301', () => {
    it('should not change the status code', () => {
      const ctx = context();
      const url = 'http://google.com';
      ctx.status = 301;
      ctx.header.accept = 'text/plain';
      ctx.redirect('http://google.com');
      assert.strictEqual(ctx.status, 301);
      assert.strictEqual(ctx.body, `Redirecting to ${url}/.`);
    });
  });

  describe('when status is 304', () => {
    it('should change the status code', () => {
      const ctx = context();
      const url = 'http://google.com';
      ctx.status = 304;
      ctx.header.accept = 'text/plain';
      ctx.redirect('http://google.com');
      assert.strictEqual(ctx.status, 302);
      assert.strictEqual(ctx.body, `Redirecting to ${url}/.`);
    });
  });

  describe('when content-type was present', () => {
    it('should overwrite content-type', () => {
      const ctx = context();
      ctx.body = {};
      const url = 'http://google.com/?foo=bar';
      ctx.header.accept = 'text/plain';
      ctx.redirect(url);
      assert.strictEqual(ctx.status, 302);
      assert.strictEqual(ctx.body, `Redirecting to ${url}.`);
      assert.strictEqual(ctx.type, 'text/plain');
    });
  });
});

function escape(html) {
  return String(html)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
