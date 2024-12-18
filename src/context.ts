import util from 'node:util';
import type { IncomingMessage, ServerResponse } from 'node:http';
import createError from 'http-errors';
import httpAssert from 'http-assert';
import delegate from 'delegates';
import statuses from 'statuses';
import Cookies from 'cookies';
import type { Application } from './application.js';
import type { Request } from './request.js';
import type { Response } from './response.js';
import type { CustomError, AnyProto } from './types.js';

export class Context {
  [key: symbol]: unknown;
  app: Application;
  req: IncomingMessage;
  res: ServerResponse;
  request: Request & AnyProto;
  response: Response & AnyProto;
  state: Record<string, any>;
  originalUrl: string;
  respond?: boolean;

  constructor(app: Application, req: IncomingMessage, res: ServerResponse) {
    this.app = app;
    this.req = req;
    this.res = res;
    this.state = {};
    this.request = new app.RequestClass(app, this, req, res);
    this.response = new app.ResponseClass(app, this as any, req, res);
    this.request.response = this.response;
    this.response.request = this.request;
    this.originalUrl = req.url!;
  }

  /**
   * util.inspect() implementation, which
   * just returns the JSON output.
   */
  inspect() {
    return this.toJSON();
  }

  /**
   * Custom inspection implementation for newer Node.js versions.
   */
  [util.inspect.custom]() {
    return this.inspect();
  }

  /**
   * Return JSON representation.
   *
   * Here we explicitly invoke .toJSON() on each
   * object, as iteration will otherwise fail due
   * to the getters and cause utilities such as
   * clone() to fail.
   */

  toJSON() {
    return {
      request: this.request.toJSON(),
      response: this.response.toJSON(),
      app: this.app.toJSON(),
      originalUrl: this.originalUrl,
      req: '<original node req>',
      res: '<original node res>',
      socket: '<original node socket>',
    };
  }

  /**
   * Similar to .throw(), adds assertion.
   *
   *    this.assert(this.user, 401, 'Please login!');
   *
   * See: https://github.com/jshttp/http-assert
   * @param {Mixed} value
   * @param {Number} status
   * @param {String} opts
   */
  assert(value: any, status?: number, opts?: Record<string, any>): void;
  assert(value: any, status?: number, msg?: string, opts?: Record<string, any>): void;
  assert(value: any, status?: number, msgOrOptions?: string | Record<string, any>, opts?: Record<string, any>) {
    if (typeof msgOrOptions === 'string') {
      return httpAssert(value, status, msgOrOptions, opts);
    }
    return httpAssert(value, status, msgOrOptions);
  }

  /**
   * Throw an error with `status` (default 500) and
   * `msg`. Note that these are user-level
   * errors, and the message may be exposed to the client.
   *
   *    this.throw(403)
   *    this.throw(400, 'name required')
   *    this.throw('something exploded')
   *    this.throw(new Error('invalid'))
   *    this.throw(400, new Error('invalid'))
   *    this.throw(400, new Error('invalid'), { foo: 'bar' })
   *    this.throw(new Error('invalid'), { foo: 'bar' })
   *
   * See: https://github.com/jshttp/http-errors
   *
   * Note: `status` should only be passed as the first parameter.
   *
   * @param {String|Number|Error} status error, msg or status
   * @param {String|Number|Error|Object} [error] error, msg, status or errorProps
   * @param {Object} [errorProps] error object properties
   */

  throw(status: number): void;
  throw(status: number, errorProps: object): void;
  throw(status: number, errorMessage: string): void;
  throw(status: number, errorMessage: string, errorProps: object): void;
  throw(status: number, error: Error): void;
  throw(status: number, error: Error, errorProps: object): void;
  throw(errorMessage: string): void;
  throw(errorMessage: string, errorProps: object): void;
  throw(errorMessage: string, status: number): void;
  throw(errorMessage: string, status: number, errorProps: object): void;
  throw(error: Error): void;
  throw(error: Error, errorProps: object): void;
  throw(error: Error, status: number): void;
  throw(error: Error, status: number, errorProps: object): void;
  throw(arg1: number | string | Error, arg2?: number | string | Error | object, errorProps?: object) {
    const args: any[] = [];
    if (typeof arg2 === 'number') {
      // throw(error, status)
      args.push(arg2);
      args.push(arg1);
    } else {
      // throw(status, error?)
      args.push(arg1);
      if (arg2) {
        args.push(arg2);
      }
    }
    if (errorProps) {
      args.push(errorProps);
    }
    throw createError(...args);
  }

  /**
   * Default error handling.
   * @private
   */
  onerror(err: CustomError) {
    // don't do anything if there is no error.
    // this allows you to pass `this.onerror`
    // to node-style callbacks.
    if (err === null || err === undefined) return;

    // When dealing with cross-globals a normal `instanceof` check doesn't work properly.
    // See https://github.com/koajs/koa/issues/1466
    // We can probably remove it once jest fixes https://github.com/facebook/jest/issues/2549.
    const isNativeError = err instanceof Error ||
      Object.prototype.toString.call(err) === '[object Error]';
    if (!isNativeError) err = new Error(util.format('non-error thrown: %j', err));

    let headerSent = false;
    if (this.response.headerSent || !this.response.writable) {
      headerSent = (err as any).headerSent = true;
    }

    // delegate
    this.app.emit('error', err, this);

    // nothing we can do here other
    // than delegate to the app-level
    // handler and log.
    if (headerSent) {
      return;
    }

    const { res } = this;

    // first unset all headers
    res.getHeaderNames().forEach(name => res.removeHeader(name));

    // then set those specified
    if (err.headers) this.response.set(err.headers);

    // force text/plain
    this.response.type = 'text';

    let statusCode = err.status || err.statusCode;

    // ENOENT support
    if (err.code === 'ENOENT') statusCode = 404;

    // default to 500
    if (typeof statusCode !== 'number' || !statuses.message[statusCode]) statusCode = 500;

    // respond
    const statusMessage = statuses.message[statusCode] as string;
    const msg = err.expose ? err.message : statusMessage;
    this.response.status = err.status = statusCode;
    this.response.length = Buffer.byteLength(msg);
    res.end(msg);
  }

  protected _cookies: Cookies | undefined;

  get cookies() {
    if (!this._cookies) {
      this._cookies = new Cookies(this.req, this.res, {
        keys: this.app.keys,
        secure: this.request.secure,
      });
    }
    return this._cookies;
  }

  set cookies(cookies: Cookies) {
    this._cookies = cookies;
  }
}

/**
 * Request delegation.
 */

delegate(Context.prototype, 'request')
  .method('acceptsLanguages')
  .method('acceptsEncodings')
  .method('acceptsCharsets')
  .method('accepts')
  .method('get')
  .method('is')
  .access('querystring')
  .access('idempotent')
  .access('socket')
  .access('search')
  .access('method')
  .access('query')
  .access('path')
  .access('url')
  .access('accept')
  .getter('origin')
  .getter('href')
  .getter('subdomains')
  .getter('protocol')
  .getter('host')
  .getter('hostname')
  .getter('URL')
  .getter('header')
  .getter('headers')
  .getter('secure')
  .getter('stale')
  .getter('fresh')
  .getter('ips')
  .getter('ip');

/**
 * Response delegation.
 */

delegate(Context.prototype, 'response')
  .method('attachment')
  .method('redirect')
  .method('remove')
  .method('vary')
  .method('has')
  .method('set')
  .method('append')
  .method('flushHeaders')
  .access('status')
  .access('message')
  .access('body')
  .access('length')
  .access('type')
  .access('lastModified')
  .access('etag')
  .getter('headerSent')
  .getter('writable');

export type ContextDelegation = Context & Pick<Request, 'acceptsLanguages' | 'acceptsEncodings' | 'acceptsCharsets'
| 'accepts' | 'get' | 'is' | 'querystring' | 'idempotent' | 'socket' | 'search' | 'method' | 'query'
| 'path' | 'url' | 'accept' | 'origin' | 'href' | 'subdomains' | 'protocol' | 'host' | 'hostname'
| 'URL' | 'header' | 'headers' | 'secure' | 'stale' | 'fresh' | 'ips' | 'ip'>
& Pick<Response, 'attachment' | 'redirect' | 'remove' | 'vary' | 'has' | 'set' | 'append' | 'flushHeaders'
| 'status' | 'message' | 'body' | 'length' | 'type' | 'lastModified' | 'etag' | 'headerSent' | 'writable'>
& AnyProto;
