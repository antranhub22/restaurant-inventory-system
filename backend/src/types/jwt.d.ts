import { JwtPayload } from 'jsonwebtoken';

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    id: number;
    username: string;
    role: string;
    permissions?: string[];
  }
} 