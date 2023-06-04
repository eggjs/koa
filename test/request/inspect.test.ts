import assert from 'node:assert';
import util from 'node:util';
import context from '../test-helpers/context';

describe('req.inspect()', () => {
  describe('with no request.req present', () => {
    it('should return null', () => {
      const request = context().request;
      request.method = 'GET';
      delete (request as any).req;
      assert(undefined === request.inspect());
      assert(util.inspect(request) === 'undefined');
    });
  });

  it('should return a json representation', () => {
    const request = context().request;
    request.method = 'GET';
    request.url = 'example.com';
    request.header.host = 'example.com';

    const expected = {
      method: 'GET',
      url: 'example.com',
      header: {
        host: 'example.com',
      },
    };

    assert.deepStrictEqual(request.inspect(), expected);
    assert.deepStrictEqual(util.inspect(request), util.inspect(expected));
  });
});
