import { Request } from '../../src/index.js';

const HOST = Symbol('request host');

export class CustomRequest extends Request {
  get host(): string {
    let host = this[HOST] as string;
    if (host) {
      return host;
    }

    if (this.app.proxy) {
      host = '127.0.0.1';
    }
    host = host || this.get('host') || '';
    this[HOST] = host = host.split(/\s*,\s*/)[0];
    return host;
  }
}
