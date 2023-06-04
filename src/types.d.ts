export type CustomError = Error & {
  headers?: object;
  status?: number;
  statusCode?: number;
  code?: string;
  expose?: boolean;
};

export type ProtoImplClass<T = object> = new(...args: any[]) => T;

export type AnyProto = {
  [key: string]: any;
};
