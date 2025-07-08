import { Request, Response, NextFunction } from 'express';
import { apiLogger } from '../services/logger.service';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Log request
  apiLogger.request(req);

  // Lưu thời điểm bắt đầu
  const startTime = Date.now();

  // Capture response
  const originalSend = res.send;
  res.send = function(body) {
    // Log response
    apiLogger.response(req, res, Date.now() - startTime);
    
    // Gọi hàm send gốc
    return originalSend.call(this, body);
  };

  // Xử lý lỗi
  const handleError = (error: Error) => {
    apiLogger.error(req, error);
  };

  // Thêm error handler
  res.on('error', handleError);

  next();
}; 