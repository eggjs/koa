import { debuglog } from 'node:util';
import Emitter from 'node:events';
import util from 'node:util';
import Stream from 'node:stream';
import http from 'node:http';
import type { AsyncLocalStorage } from 'node:async_hooks';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { getAsyncLocalStorage } from 'gals';
import { isGeneratorFunction } from 'is-type-of';
import onFinished from 'on-finished';
import statuses from 'statuses';
import compose from 'koa-compose';
import { HttpError } from 'http-errors';
import { Context } from './context.js';
import { Request } from './request.js';
import { Response } from './response.js';
import type { ContextDelegation } from './context.js';
import type { CustomError, AnyProto } from './types.js';

const debug = debuglog('@eggjs/koa:application');

export type ProtoImplClass<T = object> = new(...args: any[]) => T;
export type Next = () => Promise<void>;
type _MiddlewareFunc = (ctx: ContextDelegation, next: Next) => Promise<void> | void;
export type MiddlewareFunc = _MiddlewareFunc & { _name?: string };

/**
 * Expose `Application` class.
 * Inherits from `Emitter.prototype`.
 */
export class Application extends Emitter {
  /**
   * Make HttpError available to consumers of the library so that consumers don't
   * have a direct dependency upon `http-errors`
   */
  static HttpError = HttpError;

  proxy: boolean;
  subdomainOffset: number;
  proxyIpHeader: string;
  maxIpsCount: number;
  env: string;
  keys?: string[];
  middleware: MiddlewareFunc[];
  ctxStorage: AsyncLocalStorage<ContextDelegation>;
  silent: boolean;
  ContextClass: ProtoImplClass<ContextDelegation>;
  context: AnyProto;
  RequestClass: ProtoImplClass<Request>;
  request: AnyProto;
  ResponseClass: ProtoImplClass<Response>;
  response: AnyProto;

  /**
   * Initialize a new `Application`.
    *
    * @param {object} [options] Application options
    * @param {string} [options.env='development'] Environment
    * @param {string[]} [options.keys] Signed cookie keys
    * @param {boolean} [options.proxy] Trust proxy headers
    * @param {number} [options.subdomainOffset] Subdomain offset
    * @param {string} [options.proxyIpHeader] Proxy IP header, defaults to X-Forwarded-For
    * @param {number} [options.maxIpsCount] Max IPs read from proxy IP header, default to 0 (means infinity)
    */

  constructor(options?: {
    proxy?: boolean;
    subdomainOffset?: number;
    proxyIpHeader?: string;
    maxIpsCount?: number;
    env?: string;
    keys?: string[];
  }) {
    super();
    options = options || {};
    this.proxy = options.proxy || false;
    this.subdomainOffset = options.subdomainOffset || 2;
    this.proxyIpHeader = options.proxyIpHeader || 'X-Forwarded-For';
    this.maxIpsCount = options.maxIpsCount || 0;
    this.env = options.env || process.env.NODE_ENV || 'development';
    if (options.keys) this.keys = options.keys;
    this.middleware = [];
    this.ctxStorage = getAsyncLocalStorage();
    this.silent = false;
    this.ContextClass = class ApplicationContext extends Context {} as any;
    this.context = this.ContextClass.prototype;
    this.RequestClass = class ApplicationRequest extends Request {};
    this.request = this.RequestClass.prototype;
    this.ResponseClass = class ApplicationResponse extends Response {};
    this.response = this.ResponseClass.prototype;
  }

  /**
   * Shorthand for:
   *
   *    http.createServer(app.callback()).listen(...)
   */
  listen(...args: any[]) {
    debug('listen with args: %o', args);
    const server = http.createServer(this.callback());
    return server.listen(...args);
  }

  /**
   * Return JSON representation.
   * We only bother showing settings.
   */
  toJSON() {
    return {
      subdomainOffset: this.subdomainOffset,
      proxy: this.proxy,
      env: this.env,
    };
  }

  /**
   * Inspect implementation.
   */
  inspect() {
    return this.toJSON();
  }

  [util.inspect.custom]() {
    return this.inspect();
  }

  /**
   * Use the given middleware `fn`.
   */
  use(fn: MiddlewareFunc) {
    if (typeof fn !== 'function') throw new TypeError('middleware must be a function!');
    const name = fn._name || fn.name || '-';
    if (isGeneratorFunction(fn)) {
      throw new TypeError(`Support for generators was removed, middleware: ${name}. ` +
        'See the documentation for examples of how to convert old middleware ' +
        'https://github.com/koajs/koa/blob/master/docs/migration.md');
    }
    debug('use %o #%d', name, this.middleware.length);
    this.middleware.push(fn);
    return this;
  }

  /**
   * Return a request handler callback
   * for node's native http server.
   */
  callback() {
    const fn = compose(this.middleware);

    if (!this.listenerCount('error')) {
      this.on('error', this.onerror.bind(this));
    }

    const handleRequest = (req: IncomingMessage, res: ServerResponse) => {
      const ctx = this.createContext(req, res);
      return this.ctxStorage.run(ctx, async () => {
        return await this.#handleRequest(ctx, fn);
      });
    };

    return handleRequest;
  }

  /**
   * return current context from async local storage
   */
  get currentContext() {
    return this.ctxStorage.getStore();
  }

  /**
   * Handle request in callback.
   * @private
   */
  async #handleRequest(ctx: ContextDelegation, fnMiddleware: (ctx: ContextDelegation) => Promise<void>) {
    const res = ctx.res;
    res.statusCode = 404;
    const onerror = (err: any) => ctx.onerror(err);
    onFinished(res, onerror);
    try {
      await fnMiddleware(ctx);
      return this._respond(ctx);
    } catch (err) {
      return onerror(err);
    }
  }

  /**
   * Initialize a new context.
   * @private
   */
  protected createContext(req: IncomingMessage, res: ServerResponse) {
    const context = new this.ContextClass(this, req, res);
    return context as ContextDelegation;
  }

  /**
   * Default error handler.
   * @private
   */
  protected onerror(err: CustomError) {
    // When dealing with cross-globals a normal `instanceof` check doesn't work properly.
    // See https://github.com/koajs/koa/issues/1466
    // We can probably remove it once jest fixes https://github.com/facebook/jest/issues/2549.
    const isNativeError = err instanceof Error ||
      Object.prototype.toString.call(err) === '[object Error]';
    if (!isNativeError) throw new TypeError(util.format('non-error thrown: %j', err));

    if (err.status === 404 || err.expose) return;
    if (this.silent) return;

    const msg = err.stack || err.toString();
    console.error(`\n${msg.replace(/^/gm, '  ')}\n`);
  }

  /**
   * Response helper.
   */
  protected _respond(ctx: ContextDelegation) {
    // allow bypassing koa
    if (ctx.respond === false) return;

    if (!ctx.writable) return;

    const res = ctx.res;
    let body = ctx.body;
    const code = ctx.status;

    // ignore body
    if (statuses.empty[code]) {
      // strip headers
      ctx.body = null;
      return res.end();
    }

    if (ctx.method === 'HEAD') {
      if (!res.headersSent && !ctx.response.has('Content-Length')) {
        const { length } = ctx.response;
        if (Number.isInteger(length)) ctx.length = length;
      }
      return res.end();
    }

    // status body
    if (body == null) {
      if (ctx.response._explicitNullBody) {
        ctx.response.remove('Content-Type');
        ctx.response.remove('Transfer-Encoding');
        return res.end();
      }
      if (ctx.req.httpVersionMajor >= 2) {
        body = String(code);
      } else {
        body = ctx.message || String(code);
      }
      if (!res.headersSent) {
        ctx.type = 'text';
        ctx.length = Buffer.byteLength(body);
      }
      return res.end(body);
    }

    // responses
    if (Buffer.isBuffer(body)) return res.end(body);
    if (typeof body === 'string') return res.end(body);
    if (body instanceof Stream) return body.pipe(res);

    // body: json
    body = JSON.stringify(body);
    if (!res.headersSent) {
      ctx.length = Buffer.byteLength(body);
    }
    res.end(body);
  }
}

export default Application;
