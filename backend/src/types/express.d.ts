import 'express';

declare global {
  namespace Express {
    interface User {
      id: number; // Changed from string to number for consistency with database
      username?: string;
      role?: string;
      permissions?: string[];
      [key: string]: any;
    }
    interface Request {
      user?: User;
    }
  }
} 