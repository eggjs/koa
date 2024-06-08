export type CustomError = Error & {
  headers?: Record<string, string>;
  status?: number;
  statusCode?: number;
  code?: string;
  expose?: boolean;
};

export type AnyProto = {
  [key: string]: any;
};
