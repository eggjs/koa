import stream from 'node:stream';
import Koa from '../../src/application.js';
import type { ContextDelegation } from '../../src/context.js';

export default function context(req?: any, res?: any, app?: Koa) {
  const socket = new stream.Duplex();
  req = Object.assign({ headers: {}, socket }, stream.Readable.prototype, req);
  res = Object.assign({ _headers: {}, socket }, stream.Writable.prototype, res);
  req.socket.remoteAddress = req.socket.remoteAddress || '127.0.0.1';
  app = app || new Koa();
  res.getHeader = (k: string) => {
    return res._headers[k.toLowerCase()];
  };
  res.hasHeader = (k: string) => {
    return k.toLowerCase() in res._headers;
  };
  res.setHeader = (k: string, v: string | string[]) => {
    res._headers[k.toLowerCase()] = v;
  };
  res.removeHeader = (k: string) => {
    delete res._headers[k.toLowerCase()];
  };
  res.getHeaders = () => {
    return res._headers;
  };
  return (app as any).createContext(req, res) as ContextDelegation;
}

export function request(...args: any[]) {
  return context(...args).request;
}

export function response(...args: any[]) {
  return context(...args).response;
}
