const assert = require('assert');

let importESM = () => {};

describe.skip('Load with esm', () => {
  beforeAll(() => {
    // eslint-disable-next-line no-eval
    importESM = eval('(specifier) => import(specifier)');
  });

  it('should default export koa', async() => {
    const exported = await importESM('koa');
    const required = require('../');
    assert.strictEqual(exported.default, required);
  });

  it('should match exports own property names', async() => {
    const exported = new Set(Object.getOwnPropertyNames(await importESM('koa')));
    const required = new Set(Object.getOwnPropertyNames(require('../')));

    // Remove constructor properties + default export.
    for (const k of ['prototype', 'length', 'name']) {
      required.delete(k);
    }

    // Commented out to "fix" CommonJS, ESM, bundling issue.
    // @see https://github.com/koajs/koa/issues/1513
    // exported.delete('default');

    assert.strictEqual(exported.size, required.size);
    assert.strictEqual([...exported].every(property => required.has(property)), true);
  });

  it('CommonJS exports default property', async() => {
    const required = require('../');
    assert.strictEqual(required.hasOwnProperty('default'), true);
  });

  it('CommonJS exports default property referencing self', async() => {
    const required = require('../');
    assert.strictEqual(required.default, required);
  });
});
