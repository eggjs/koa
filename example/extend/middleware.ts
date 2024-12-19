import { MiddlewareFunc, Context, type ContextDelegation } from '../../src/index.js';

class CustomContext extends Context {
  // Add your custom properties and methods here
  get hello() {
    return 'world';
  }
}

type ICustomContext = CustomContext & ContextDelegation;

export const middleware: MiddlewareFunc<ICustomContext> = async (ctx, next) => {
  console.log('middleware start, %s', ctx.hello, ctx.writable);
  await next();
  console.log('middleware end');
};