import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { JwtPayload } from 'jsonwebtoken';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: number;
      email: string;
      role: Role;
    };
  }
}

declare global {
  namespace Express {
    interface User {
      userId: number;
      email: string;
      role: Role;
    }

    interface Request<
      P = ParamsDictionary,
      ResBody = any,
      ReqBody = any,
      ReqQuery = Query,
      Locals extends Record<string, any> = Record<string, any>
    > extends ExpressRequest {
      user?: User;
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
    }

    interface Response<
      ResBody = any,
      Locals extends Record<string, any> = Record<string, any>
    > extends ExpressResponse {
      json(data: ResBody): this;
    }

    interface Multer {
      File: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination?: string;
        filename?: string;
        path?: string;
        buffer?: Buffer;
      }
    }
  }
}

export interface TypedRequestBody<T> extends Express.Request {
  body: T;
}

export interface TypedRequestQuery<T> extends Express.Request {
  query: T;
}

export interface TypedRequestParams<T> extends Express.Request {
  params: T;
}

export interface TypedRequest<T extends Record<string, any>, U extends Record<string, any>> extends Express.Request {
  body: T;
  query: U;
}

export interface TypedResponse<T> extends Express.Response {
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