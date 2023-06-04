import net from 'node:net';
import { format as stringify } from 'node:url';
import qs from 'node:querystring';
import util from 'node:util';
import type { ParsedUrlQuery } from 'node:querystring';
import type { IncomingMessage, ServerResponse } from 'node:http';
import accepts from 'accepts';
import contentType from 'content-type';
import parse from 'parseurl';
import typeis from 'type-is';
import fresh from 'fresh';
import only from 'only';
import type Application from './application';
import type Context from './context';
import type Response from './response';

export default class Request {
  app: Application;
  req: IncomingMessage;
  res: ServerResponse;
  ctx: Context;
  response: Response;
  originalUrl: string;

  constructor(app: Application, ctx: Context, req: IncomingMessage, res: ServerResponse) {
    this.app = app;
    this.req = req;
    this.res = res;
    this.ctx = ctx;
    this.originalUrl = req.url!;
  }

  /**
   * Return request header.
   */

  get header() {
    return this.req.headers;
  }

  /**
   * Set request header.
   */

  set header(val) {
    this.req.headers = val;
  }

  /**
   * Return request header, alias as request.header
   */

  get headers() {
    return this.req.headers;
  }

  /**
   * Set request header, alias as request.header
   */

  set headers(val) {
    this.req.headers = val;
  }

  /**
   * Get request URL.
   */

  get url() {
    return this.req.url!;
  }

  /**
   * Set request URL.
   */

  set url(val) {
    this.req.url = val;
  }

  /**
   * Get origin of URL.
   */

  get origin() {
    return `${this.protocol}://${this.host}`;
  }

  /**
   * Get full request URL.
   */

  get href() {
    // support: `GET http://example.com/foo`
    if (/^https?:\/\//i.test(this.originalUrl)) return this.originalUrl;
    return this.origin + this.originalUrl;
  }

  /**
   * Get request method.
   */

  get method() {
    return this.req.method!;
  }

  /**
   * Set request method.
   */

  set method(val) {
    this.req.method = val;
  }

  /**
   * Get request pathname.
   */

  get path() {
    return parse(this.req).pathname as string;
  }

  /**
   * Set pathname, retaining the query string when present.
   */

  set path(path) {
    const url = parse(this.req);
    if (url.pathname === path) return;

    url.pathname = path;
    url.path = null;

    this.url = stringify(url);
  }

  #parsedUrlQueryCache: Record<string, ParsedUrlQuery>;

  /**
   * Get parsed query string.
   */
  get query() {
    const str = this.querystring;
    if (!this.#parsedUrlQueryCache) {
      this.#parsedUrlQueryCache = {};
    }
    let parsedUrlQuery = this.#parsedUrlQueryCache[str];
    if (!parsedUrlQuery) {
      parsedUrlQuery = this.#parsedUrlQueryCache[str] = qs.parse(str);
    }
    return parsedUrlQuery;
  }

  /**
   * Set query string as an object.
   */

  set query(obj) {
    this.querystring = qs.stringify(obj);
  }

  /**
   * Get query string.
   */

  get querystring() {
    if (!this.req) return '';
    return parse(this.req).query || '';
  }

  /**
   * Set query string.
   */

  set querystring(str) {
    const url = parse(this.req);
    if (url.search === `?${str}`) return;

    url.search = str;
    url.path = null;
    this.url = stringify(url);
  }

  /**
   * Get the search string. Same as the query string
   * except it includes the leading ?.
   */

  get search() {
    if (!this.querystring) return '';
    return `?${this.querystring}`;
  }

  /**
   * Set the search string. Same as
   * request.querystring= but included for ubiquity.
   */

  set search(str) {
    this.querystring = str;
  }

  /**
   * Parse the "Host" header field host
   * and support X-Forwarded-Host when a
   * proxy is enabled.
   * return `hostname:port` format
   */
  get host() {
    const proxy = this.app.proxy;
    let host = proxy ? this.get<string>('X-Forwarded-Host') : '';
    if (!host) {
      if (this.req.httpVersionMajor >= 2) host = this.get(':authority');
      if (!host) host = this.get('Host');
    }
    if (!host) return '';
    return host.split(/\s*,\s*/, 1)[0];
  }

  /**
   * Parse the "Host" header field hostname
   * and support X-Forwarded-Host when a
   * proxy is enabled.
   */
  get hostname() {
    const host = this.host;
    if (!host) return '';
    if (host[0] === '[') return this.URL.hostname || ''; // IPv6
    return host.split(':', 1)[0];
  }

  #memoizedURL: URL;  

  /**
   * Get WHATWG parsed URL.
   * Lazily memoized.
   */
  get URL() {
    if (!this.#memoizedURL) {
      const originalUrl = this.originalUrl || ''; // avoid undefined in template string
      try {
        this.#memoizedURL = new URL(`${this.origin}${originalUrl}`);
      } catch {
        this.#memoizedURL = Object.create(null);
      }
    }
    return this.#memoizedURL;
  }

  /**
   * Check if the request is fresh, aka
   * Last-Modified and/or the ETag
   * still match.
   */
  get fresh() {
    const method = this.method;
    const status = this.response.status;

    // GET or HEAD for weak freshness validation only
    if (method !== 'GET' && method !== 'HEAD') return false;

    // 2xx or 304 as per rfc2616 14.26
    if ((status >= 200 && status < 300) || status === 304) {
      return fresh(this.header, this.response.header);
    }

    return false;
  }

  /**
   * Check if the request is stale, aka
   * "Last-Modified" and / or the "ETag" for the
   * resource has changed.
   */
  get stale() {
    return !this.fresh;
  }

  /**
   * Check if the request is idempotent.
   */
  get idempotent() {
    const methods = [ 'GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS', 'TRACE' ];
    return methods.includes(this.method);
  }

  /**
   * Return the request socket.
   */
  get socket() {
    return this.req.socket;
  }

  /**
   * Get the charset when present or undefined.
   */
  get charset() {
    try {
      const { parameters } = contentType.parse(this.req);
      return parameters.charset || '';
    } catch {
      return '';
    }
  }

  /**
   * Return parsed Content-Length when present.
   */
  get length() {
    const len = this.get<string>('Content-Length');
    if (len === '') return;
    return ~~len;
  }

  /**
   * Return the protocol string "http" or "https"
   * when requested with TLS. When the proxy setting
   * is enabled the "X-Forwarded-Proto" header
   * field will be trusted. If you're running behind
   * a reverse proxy that supplies https for you this
   * may be enabled.
   */
  get protocol() {
    if (this.socket['encrypted']) return 'https';
    if (!this.app.proxy) return 'http';
    const proto = this.get<string>('X-Forwarded-Proto');
    return proto ? proto.split(/\s*,\s*/, 1)[0] : 'http';
  }

  /**
   * Shorthand for:
   *
   *    this.protocol == 'https'
   */
  get secure() {
    return this.protocol === 'https';
  }

  /**
   * When `app.proxy` is `true`, parse
   * the "X-Forwarded-For" ip address list.
   *
   * For example if the value was "client, proxy1, proxy2"
   * you would receive the array `["client", "proxy1", "proxy2"]`
   * where "proxy2" is the furthest down-stream.
   */
  get ips() {
    const proxy = this.app.proxy;
    const val = this.get<string>(this.app.proxyIpHeader);
    let ips = proxy && val
      ? val.split(/\s*,\s*/)
      : [];
    if (this.app.maxIpsCount > 0) {
      ips = ips.slice(-this.app.maxIpsCount);
    }
    return ips;
  }

  #ip: string;
  /**
   * Return request's remote address
   * When `app.proxy` is `true`, parse
   * the "X-Forwarded-For" ip address list and return the first one
   */
  get ip() {
    if (!this.#ip) {
      this.#ip = this.ips[0] || this.socket.remoteAddress || '';
    }
    return this.#ip;
  }

  set ip(ip: string) {
    this.#ip = ip;
  }

  /**
   * Return subdomains as an array.
   *
   * Subdomains are the dot-separated parts of the host before the main domain
   * of the app. By default, the domain of the app is assumed to be the last two
   * parts of the host. This can be changed by setting `app.subdomainOffset`.
   *
   * For example, if the domain is "tobi.ferrets.example.com":
   * If `app.subdomainOffset` is not set, this.subdomains is
   * `["ferrets", "tobi"]`.
   * If `app.subdomainOffset` is 3, this.subdomains is `["tobi"]`.
   */
  get subdomains() {
    const offset = this.app.subdomainOffset;
    const hostname = this.hostname;
    if (net.isIP(hostname)) return [];
    return hostname
      .split('.')
      .reverse()
      .slice(offset);
  }

  #accept: any;
  /**
   * Get accept object.
   * Lazily memoized.
   */
  get accept() {
    return this.#accept || (this.#accept = accepts(this.req));
  }

  /**
   * Set accept object.
   */
  set accept(obj) {
    this.#accept = obj;
  }

  /**
   * Check if the given `type(s)` is acceptable, returning
   * the best match when true, otherwise `false`, in which
   * case you should respond with 406 "Not Acceptable".
   *
   * The `type` value may be a single mime type string
   * such as "application/json", the extension name
   * such as "json" or an array `["json", "html", "text/plain"]`. When a list
   * or array is given the _best_ match, if any is returned.
   *
   * Examples:
   *
   *     // Accept: text/html
   *     this.accepts('html');
   *     // => "html"
   *
   *     // Accept: text/*, application/json
   *     this.accepts('html');
   *     // => "html"
   *     this.accepts('text/html');
   *     // => "text/html"
   *     this.accepts('json', 'text');
   *     // => "json"
   *     this.accepts('application/json');
   *     // => "application/json"
   *
   *     // Accept: text/*, application/json
   *     this.accepts('image/png');
   *     this.accepts('png');
   *     // => false
   *
   *     // Accept: text/*;q=.5, application/json
   *     this.accepts(['html', 'json']);
   *     this.accepts('html', 'json');
   *     // => "json"
   */
  accepts(...args: any[]): string | string[] | false {
    return this.accept.types(...args);
  }

  /**
   * Return accepted encodings or best fit based on `encodings`.
   *
   * Given `Accept-Encoding: gzip, deflate`
   * an array sorted by quality is returned:
   *
   *     ['gzip', 'deflate']
   */
  acceptsEncodings(...args: any[]): string | string[] {
    return this.accept.encodings(...args);
  }

  /**
   * Return accepted charsets or best fit based on `charsets`.
   *
   * Given `Accept-Charset: utf-8, iso-8859-1;q=0.2, utf-7;q=0.5`
   * an array sorted by quality is returned:
   *
   *     ['utf-8', 'utf-7', 'iso-8859-1']
   */
  acceptsCharsets(...args: any[]): string | string[] {
    return this.accept.charsets(...args);
  }

  /**
   * Return accepted languages or best fit based on `langs`.
   *
   * Given `Accept-Language: en;q=0.8, es, pt`
   * an array sorted by quality is returned:
   *
   *     ['es', 'pt', 'en']
   */
  acceptsLanguages(...args: any[]): string | string[] {
    return this.accept.languages(...args);
  }

  /**
   * Check if the incoming request contains the "Content-Type"
   * header field and if it contains any of the given mime `type`s.
   * If there is no request body, `null` is returned.
   * If there is no content type, `false` is returned.
   * Otherwise, it returns the first `type` that matches.
   *
   * Examples:
   *
   *     // With Content-Type: text/html; charset=utf-8
   *     this.is('html'); // => 'html'
   *     this.is('text/html'); // => 'text/html'
   *     this.is('text/*', 'application/json'); // => 'text/html'
   *
   *     // When Content-Type is application/json
   *     this.is('json', 'urlencoded'); // => 'json'
   *     this.is('application/json'); // => 'application/json'
   *     this.is('html', 'application/*'); // => 'application/json'
   *
   *     this.is('html'); // => false
   */
  is(type?: string | string[], ...types: string[]): string | false | null {
    return typeis(this.req, type, ...types);
  }

  /**
   * Return the request mime type void of
   * parameters such as "charset".
   */
  get type() {
    const type = this.get<string>('Content-Type');
    if (!type) return '';
    return type.split(';')[0];
  }

  /**
   * Return request header.
   *
   * The `Referrer` header field is special-cased,
   * both `Referrer` and `Referer` are interchangeable.
   *
   * Examples:
   *
   *     this.get('Content-Type');
   *     // => "text/plain"
   *
   *     this.get('content-type');
   *     // => "text/plain"
   *
   *     this.get('Something');
   *     // => ''
   */
  get<T = string | string []>(field: string): T {
    const req = this.req;
    switch (field = field.toLowerCase()) {
      case 'referer':
      case 'referrer':
        return (req.headers.referrer || req.headers.referer || '') as T;
      default:
        return (req.headers[field] || '') as T;
    }
  }

  /**
   * Inspect implementation.
   */
  inspect() {
    if (!this.req) return;
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
   */
  toJSON() {
    return only(this, [
      'method',
      'url',
      'header',
    ]);
  }
}
