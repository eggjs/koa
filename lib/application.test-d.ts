import { expectType } from 'tsd';
import { Context } from './application';
import Application from './application';

const ctx = {} as Context;
expectType<string>(ctx.ip);
expectType<Application>(ctx.app);

const app = {} as Application;
expectType<string>(app.env);
expectType<Context | undefined>(app.ctxStorage.getStore());
