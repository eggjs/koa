import { expectType } from 'tsd';
import { Context } from '../src/index.js';
import Application from '../src/application.js';

const ctx = {} as Context;
expectType<string>(ctx.ip);
expectType<Application>(ctx.app);

const app = {} as Application;
expectType<string>(app.env);
expectType<Context | undefined>(app.ctxStorage.getStore());
