import { expectType } from 'tsd';
import { Context } from '../src/application';
import Application from '../src/application';

const ctx = {} as Context;
expectType<string>(ctx.ip);

const app = {} as Application;
expectType<string>(app.env);
expectType<Context | undefined>(app.ctxStorage.getStore());
