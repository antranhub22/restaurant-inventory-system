import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { JwtPayload } from 'jsonwebtoken';

declare module 'express-serve-static-core' {
  interface User {
    userId: number;
    email: string;
    role: Role;
  }

  interface Request {
    user?: User;
    file?: Express.Multer.File;
    files?: Express.Multer.File[];
  }

  interface Response {
    json(data: any): this;
  }

  interface Application {
    use: any;
    json: any;
    urlencoded: any;
    static: any;
  }
}

declare module 'express' {
  interface Express {
    json: any;
    urlencoded: any;
    static: any;
  }

  interface Application {
    use: any;
    json: any;
    urlencoded: any;
    static: any;
  }

  interface Request extends ExpressRequest {
    user?: User;
    file?: Express.Multer.File;
    files?: Express.Multer.File[];
  }

  interface Response extends ExpressResponse {
    json(data: any): this;
  }

  export interface Express {
    (): Application;
  }

  export interface Application {
    use: any;
    json: any;
    urlencoded: any;
    static: any;
  }

  export interface NextFunction {
    (err?: any): void;
  }

  export interface Express {
    json: any;
    urlencoded: any;
    static: any;
  }

  export interface Express {
    (): Application;
    json: any;
    urlencoded: any;
    static: any;
  }

  export interface Express {
    (): Application;
    json: any;
    urlencoded: any;
    static: any;
    default: Express;
  }

  export interface Express {
    (): Application;
    json: any;
    urlencoded: any;
    static: any;
    default: Express;
    default(): Application;
  }
}

export interface TypedRequestBody<T> extends ExpressRequest {
  body: T;
}

export interface TypedRequestQuery<T> extends ExpressRequest {
  query: T;
}

export interface TypedRequestParams<T> extends ExpressRequest {
  params: T;
}

export interface TypedRequest<T extends Record<string, any>, U extends Record<string, any>> extends ExpressRequest {
  body: T;
  query: U;
}

export interface TypedResponse<T> extends ExpressResponse {
  json: (body: T) => TypedResponse<T>;
}

export type RequestHandler<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Query
> = (
  req: TypedRequest<ReqBody, ReqQuery>,
  res: TypedResponse<ResBody>,
  next: NextFunction
) => void | Promise<void>;

export {}; 