import { expectType } from 'tsd';
import type { Context } from '../src/index.js';
import type Application from '../src/application.js';

const ctx = {} as Context;
expectType<string>(ctx.ip);
expectType<Application>(ctx.app);

const app = {} as Application;
expectType<string>(app.env);
expectType<Context | undefined>(app.ctxStorage.getStore());
