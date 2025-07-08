import 'express';

declare global {
  namespace Express {
    interface User {
      id: string;
      role?: string;
      [key: string]: any;
    }
    interface Request {
      user?: User;
    }
  }
} 