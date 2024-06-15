import { expectType } from 'tsd';
import { ContextDelegation } from '../src/index.js';
import Application from '../src/application.js';

const ctx = {} as ContextDelegation;
expectType<string>(ctx.ip);
expectType<Application>(ctx.app);

const app = {} as Application;
expectType<string>(app.env);
expectType<ContextDelegation | undefined>(app.ctxStorage.getStore());
