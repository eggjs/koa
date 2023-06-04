import { expectType } from 'tsd';
import { Context } from '../src/application';

const ctx = {} as Context;

expectType<string>(ctx.ip);
