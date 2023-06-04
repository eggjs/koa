import assert from 'node:assert';
import util from 'node:util';
import ContextClass from '../../src/context';
import context from '../test-helpers/context';

describe('ctx.inspect()', () => {
  it('should return a json representation', () => {
    const ctx = context();
    const toJSON = ctx.toJSON();

    assert.deepStrictEqual(toJSON, ctx.inspect());
    assert.deepStrictEqual(util.inspect(toJSON), util.inspect(ctx));
  });

  // console.log(require.cache) will call prototype.inspect()
  it('should not crash when called on the prototype', () => {
    assert.deepStrictEqual(ContextClass.prototype, ContextClass.prototype.inspect());
    assert.deepStrictEqual(util.inspect(ContextClass.prototype.inspect()), util.inspect(ContextClass.prototype));
  });
});
