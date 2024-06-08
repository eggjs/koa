
import assert from 'node:assert';
import util from 'node:util';
import Koa from '../../src/index.js';

describe('app.inspect()', () => {
  const app = new Koa();

  it('should work', () => {
    const str = util.inspect(app);
    assert.strictEqual("{ subdomainOffset: 2, proxy: false, env: 'test' }", str);
  });

  it('should return a json representation', () => {
    assert.deepStrictEqual(
      { subdomainOffset: 2, proxy: false, env: 'test' },
      app.inspect(),
    );
  });
});
