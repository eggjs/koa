import assert from 'node:assert';
import { runInNewContext } from 'node:vm';
import mm from 'mm';
import Koa from '../../src/index.js';

describe('app.onerror(err)', () => {
  afterEach(mm.restore);

  it('should throw an error if a non-error is given', () => {
    const app = new Koa();

    assert.throws(() => {
      (app as any).onerror('foo' as any);
    }, TypeError, 'non-error thrown: foo');
  });

  it('should accept errors coming from other scopes', () => {
    const app = new Koa();
    const ExternError = runInNewContext('Error');
    const error = Object.assign(new ExternError('boom'), {
      status: 418,
      expose: true,
    });

    assert.doesNotThrow(() => (app as any).onerror(error));
  });

  it('should do nothing if status is 404', () => {
    const app = new Koa();
    const err = new Error();

    (err as any).status = 404;

    mm.spy(console, 'error');
    (app as any).onerror(err);
    assert.strictEqual((console.error as any).called, undefined);
  });

  it('should do nothing if .silent', () => {
    const app = new Koa();
    (app as any).silent = true;
    const err = new Error();

    mm.spy(console, 'error');
    (app as any).onerror(err);
    assert.strictEqual((console.error as any).called, undefined);
  });

  it('should log the error to stderr', () => {
    const app = new Koa();
    app.env = 'dev';

    const err = new Error();
    err.stack = 'Foo';

    mm.spy(console, 'error');
    (app as any).onerror(err);
    assert.strictEqual((console.error as any).called, 1);
  });
});
