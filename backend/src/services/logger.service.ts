import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';

const { combine, timestamp, printf, colorize } = winston.format;

// Custom format cho logs
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Tạo logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    logFormat
  ),
  transports: [
    // Log errors vào file riêng
    new winston.transports.DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '14d'
    }),
    
    // Log tất cả các levels vào file chung
    new winston.transports.DailyRotateFile({
      filename: path.join('logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d'
    })
  ]
});

// Thêm console transport trong môi trường development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      logFormat
    )
  }));
}

// Các hàm helper cho OCR logging
export const ocrLogger = {
  start: (imageId: string, metadata?: any) => {
    logger.info('OCR processing started', {
      imageId,
      ...metadata
    });
  },

  complete: (imageId: string, duration: number, confidence: number) => {
    logger.info('OCR processing completed', {
      imageId,
      duration,
      confidence
    });
  },

  error: (imageId: string, error: Error, metadata?: any) => {
    logger.error('OCR processing failed', {
      imageId,
      error: error.message,
      stack: error.stack,
      ...metadata
    });
  }
};

// Các hàm helper cho form logging
export const formLogger = {
  created: (formId: string, type: string, metadata?: any) => {
    logger.info('Form created', {
      formId,
      type,
      ...metadata
    });
  },

  updated: (formId: string, changes: any) => {
    logger.info('Form updated', {
      formId,
      changes
    });
  },

  error: (formId: string, error: Error, metadata?: any) => {
    logger.error('Form processing error', {
      formId,
      error: error.message,
      stack: error.stack,
      ...metadata
    });
  }
};

// Các hàm helper cho API logging
export const apiLogger = {
  request: (req: any) => {
    logger.info('API request', {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      body: req.body,
      userId: req.user?.id
    });
  },

  response: (req: any, res: any, duration: number) => {
    logger.info('API response', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      userId: req.user?.id
    });
  },

  error: (req: any, error: Error) => {
    logger.error('API error', {
      method: req.method,
      url: req.url,
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
  }
};

export default logger; 