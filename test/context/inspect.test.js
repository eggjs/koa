
const assert = require('node:assert');
const util = require('node:util');
const prototype = require('../../lib/context');
const context = require('../../test-helpers/context');

describe('ctx.inspect()', () => {
  it('should return a json representation', () => {
    const ctx = context();
    const toJSON = ctx.toJSON(ctx);

    assert.deepStrictEqual(toJSON, ctx.inspect());
    assert.deepStrictEqual(util.inspect(toJSON), util.inspect(ctx));
  });

  // console.log(require.cache) will call prototype.inspect()
  it('should not crash when called on the prototype', () => {
    assert.deepStrictEqual(prototype, prototype.inspect());
    assert.deepStrictEqual(util.inspect(prototype.inspect()), util.inspect(prototype));
  });
});
