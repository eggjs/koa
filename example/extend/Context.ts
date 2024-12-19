import { Context } from '../../src/index.js';

export class CustomContext extends Context {
  get state() {
    return { foo: 'bar' };
  }
}
