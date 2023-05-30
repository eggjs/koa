# @eggjs/koa

@eggjs/koa is forked from [Koa v2.x](https://github.com/koajs/koa/tree/v2.x) for LTS and drop Node.js < 16.13.0 support.

<img src="/docs/logo.png" alt="Koa middleware framework for nodejs"/>

[![NPM version](https://img.shields.io/npm/v/@eggjs/koa.svg?style=flat-square)](https://npmjs.org/package/@eggjs/koa)
[![NPM quality](http://npm.packagequality.com/shield/@eggjs/koa.svg?style=flat-square)](http://packagequality.com/#?package=@eggjs/koa)
[![NPM download](https://img.shields.io/npm/dm/@eggjs/koa.svg?style=flat-square)](https://npmjs.org/package/@eggjs/koa)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Feggjs%2Fkoa.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Feggjs%2Fkoa?ref=badge_shield)
[![Continuous Integration](https://github.com/eggjs/koa/workflows/Continuous%20integration/badge.svg)](https://github.com/eggjs/koa/actions?query=branch%3Amaster)
[![Test coverage](https://img.shields.io/codecov/c/github/eggjs/koa.svg?style=flat-square)](https://codecov.io/gh/eggjs/koa)
[![Known Vulnerabilities](https://snyk.io/test/npm/@eggjs/koa/badge.svg?style=flat-square)](https://snyk.io/test/npm/@eggjs/koa)

Expressive HTTP middleware framework for node.js to make web applications and APIs more enjoyable to write. Koa's middleware stack flows in a stack-like manner, allowing you to perform actions downstream then filter and manipulate the response upstream.

Only methods that are common to nearly all HTTP servers are integrated directly into Koa's small ~570 SLOC codebase. This
includes things like content negotiation, normalization of node inconsistencies, redirection, and a few others.

Koa is not bundled with any middleware.

## Installation

@eggjs/koa requires __node v16.3.0__ or higher for Node.js LTS support.

```bash
npm install @eggjs/koa
```

## Hello Koa

```js
const Koa = require('@eggjs/koa');
const app = new Koa();

// response
app.use(ctx => {
  ctx.body = 'Hello Koa';
});

app.listen(3000);
```

## Getting started

- [Kick-Off-Koa](https://github.com/koajs/kick-off-koa) - An intro to Koa via a set of self-guided workshops.
- [Workshop](https://github.com/koajs/workshop) - A workshop to learn the basics of Koa, Express' spiritual successor.
- [Introduction Screencast](https://knowthen.com/episode-3-koajs-quickstart-guide/) - An introduction to installing and getting started with Koa

## Middleware

Koa is a middleware framework that can take two different kinds of functions as middleware:

- async function
- common function

Here is an example of logger middleware with each of the different functions:

### ___async___ functions (node v7.6+)

```js
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});
```

### Common function

```js
// Middleware normally takes two parameters (ctx, next), ctx is the context for one request,
// next is a function that is invoked to execute the downstream middleware. It returns a Promise with a then function for running code after completion.

app.use((ctx, next) => {
  const start = Date.now();
  return next().then(() => {
    const ms = Date.now() - start;
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
  });
});
```

### Koa v1.x Middleware Signature

The middleware signature changed between v1.x and v2.x.  The older signature is deprecated.

__Old signature middleware support will be removed in v3__

Please see the [Migration Guide](docs/migration.md) for more information on upgrading from v1.x and
using v1.x middleware with v2.x.

## Context, Request and Response

Each middleware receives a Koa `Context` object that encapsulates an incoming
http message and the corresponding response to that message.  `ctx` is often used
as the parameter name for the context object.

```js
app.use(async (ctx, next) => {
  await next();
});
```

Koa provides a `Request` object as the `request` property of the `Context`.  
Koa's `Request` object provides helpful methods for working with
http requests which delegate to an [IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage)
from the node `http` module.

Here is an example of checking that a requesting client supports xml.

```js
app.use(async (ctx, next) => {
  ctx.assert(ctx.request.accepts('xml'), 406);
  // equivalent to:
  // if (!ctx.request.accepts('xml')) ctx.throw(406);
  await next();
});
```

Koa provides a `Response` object as the `response` property of the `Context`.  
Koa's `Response` object provides helpful methods for working with
http responses which delegate to a [ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse)
.  

Koa's pattern of delegating to Node's request and response objects rather than extending them
provides a cleaner interface and reduces conflicts between different middleware and with Node
itself as well as providing better support for stream handling.  The `IncomingMessage` can still be
directly accessed as the `req` property on the `Context` and `ServerResponse` can be directly
accessed as the `res` property on the `Context`.

Here is an example using Koa's `Response` object to stream a file as the response body.

```js
app.use(async (ctx, next) => {
  await next();
  ctx.response.type = 'xml';
  ctx.response.body = fs.createReadStream('really_large.xml');
});
```

The `Context` object also provides shortcuts for methods on its `request` and `response`.  In the prior
examples,  `ctx.type` can be used instead of `ctx.response.type` and `ctx.accepts` can be used
instead of `ctx.request.accepts`.

For more information on `Request`, `Response` and `Context`, see the [Request API Reference](docs/api/request.md),
[Response API Reference](docs/api/response.md) and [Context API Reference](docs/api/context.md).

## Koa Application

The object created when executing `new Koa()` is known as the Koa application object.

The application object is Koa's interface with node's http server and handles the registration
of middleware, dispatching to the middleware from http, default error handling, as well as
configuration of the context, request and response objects.

Learn more about the application object in the [Application API Reference](docs/api/index.md).

## Documentation

- [Usage Guide](docs/guide.md)
- [Error Handling](docs/error-handling.md)
- [Koa for Express Users](docs/koa-vs-express.md)
- [FAQ](docs/faq.md)
- [API documentation](docs/api/index.md)

## Troubleshooting

Check the [Troubleshooting Guide](docs/troubleshooting.md) or [Debugging Koa](docs/guide.md#debugging-koa) in
the general Koa guide.

## Running tests

```bash
npm test
```

## Reporting vulnerabilities

To report a security vulnerability, please do not open an issue, as this notifies attackers of the vulnerability. Instead, please email [fengmk2](mailto:fengmk2+eggjs@gmail.com) to disclose.

## Authors

See [AUTHORS](AUTHORS).

## Community

- [Badgeboard](https://koajs.github.io/badgeboard) and list of official modules
- [Examples](https://github.com/koajs/examples)
- [Middleware](https://github.com/koajs/koa/wiki) list
- [Wiki](https://github.com/koajs/koa/wiki)
- [Reddit Community](https://www.reddit.com/r/koajs)
- [Mailing list](https://groups.google.com/forum/#!forum/koajs)
- [中文文档 v1.x](https://github.com/guo-yu/koa-guide)
- [中文文档 v2.x](https://github.com/demopark/koa-docs-Zh-CN)
- __[#koajs]__ on freenode

## Job Board

Looking for a career upgrade?

<a href="https://astro.netlify.com/automattic"><img src="https://astro.netlify.com/static/automattic.png"></a>
<a href="https://astro.netlify.com/segment"><img src="https://astro.netlify.com/static/segment.png"></a>
<a href="https://astro.netlify.com/auth0"><img src="https://astro.netlify.com/static/auth0.png"/></a>

## Backers

Support us with a monthly donation and help us continue our activities.

<a href="https://opencollective.com/koajs/backer/0/website" target="_blank"><img src="https://opencollective.com/koajs/backer/0/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/1/website" target="_blank"><img src="https://opencollective.com/koajs/backer/1/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/2/website" target="_blank"><img src="https://opencollective.com/koajs/backer/2/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/3/website" target="_blank"><img src="https://opencollective.com/koajs/backer/3/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/4/website" target="_blank"><img src="https://opencollective.com/koajs/backer/4/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/5/website" target="_blank"><img src="https://opencollective.com/koajs/backer/5/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/6/website" target="_blank"><img src="https://opencollective.com/koajs/backer/6/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/7/website" target="_blank"><img src="https://opencollective.com/koajs/backer/7/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/8/website" target="_blank"><img src="https://opencollective.com/koajs/backer/8/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/9/website" target="_blank"><img src="https://opencollective.com/koajs/backer/9/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/10/website" target="_blank"><img src="https://opencollective.com/koajs/backer/10/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/11/website" target="_blank"><img src="https://opencollective.com/koajs/backer/11/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/12/website" target="_blank"><img src="https://opencollective.com/koajs/backer/12/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/13/website" target="_blank"><img src="https://opencollective.com/koajs/backer/13/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/14/website" target="_blank"><img src="https://opencollective.com/koajs/backer/14/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/15/website" target="_blank"><img src="https://opencollective.com/koajs/backer/15/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/16/website" target="_blank"><img src="https://opencollective.com/koajs/backer/16/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/17/website" target="_blank"><img src="https://opencollective.com/koajs/backer/17/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/18/website" target="_blank"><img src="https://opencollective.com/koajs/backer/18/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/19/website" target="_blank"><img src="https://opencollective.com/koajs/backer/19/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/20/website" target="_blank"><img src="https://opencollective.com/koajs/backer/20/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/21/website" target="_blank"><img src="https://opencollective.com/koajs/backer/21/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/22/website" target="_blank"><img src="https://opencollective.com/koajs/backer/22/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/23/website" target="_blank"><img src="https://opencollective.com/koajs/backer/23/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/24/website" target="_blank"><img src="https://opencollective.com/koajs/backer/24/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/25/website" target="_blank"><img src="https://opencollective.com/koajs/backer/25/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/26/website" target="_blank"><img src="https://opencollective.com/koajs/backer/26/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/27/website" target="_blank"><img src="https://opencollective.com/koajs/backer/27/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/28/website" target="_blank"><img src="https://opencollective.com/koajs/backer/28/avatar.svg"></a>
<a href="https://opencollective.com/koajs/backer/29/website" target="_blank"><img src="https://opencollective.com/koajs/backer/29/avatar.svg"></a>

## Sponsors

Become a sponsor and get your logo on our README on Github with a link to your site.

<a href="https://opencollective.com/koajs/sponsor/0/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/1/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/2/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/3/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/4/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/5/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/6/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/7/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/8/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/9/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/9/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/10/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/10/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/11/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/11/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/12/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/12/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/13/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/13/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/14/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/14/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/15/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/15/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/16/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/16/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/17/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/17/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/18/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/18/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/19/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/19/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/20/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/20/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/21/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/21/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/22/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/22/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/23/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/23/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/24/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/24/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/25/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/25/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/26/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/26/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/27/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/27/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/28/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/28/avatar.svg"></a>
<a href="https://opencollective.com/koajs/sponsor/29/website" target="_blank"><img src="https://opencollective.com/koajs/sponsor/29/avatar.svg"></a>

# License

[MIT](https://github.com/eggjs/koa/blob/master/LICENSE)
