import express from 'express';
import multer from 'multer';
import importController from '../controllers/import.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = express.Router();

// Cấu hình multer cho upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/imports/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Chỉ cho phép upload ảnh và PDF
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh hoặc PDF'));
    }
  }
});

// Routes
router.post('/',
  authenticate,
  authorize(Role.MANAGER, Role.OWNER),
  importController.createImport
);

router.get('/',
  authenticate,
  importController.getImports
);

router.get('/:id',
  authenticate,
  importController.getImportById
);

router.post('/:id/approve',
  authenticate,
  authorize(Role.MANAGER, Role.OWNER),
  importController.approveImport
);

router.post('/:id/reject',
  authenticate,
  authorize(Role.MANAGER, Role.OWNER),
  importController.rejectImport
);

router.post('/:id/attachments',
  authenticate,
  upload.single('file'),
  importController.uploadAttachment
);

export default router; 