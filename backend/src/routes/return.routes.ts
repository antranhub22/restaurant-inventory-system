import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';
import returnController from '../controllers/return.controller';
import multer from 'multer';

const router = Router();

// Cấu hình multer cho upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/returns/');
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
  authorize([Role.manager, Role.owner, Role.supervisor]),
  returnController.createReturn
);

router.get('/',
  authenticate,
  returnController.getReturns
);

router.get('/:id',
  authenticate,
  returnController.getReturnById
);

router.post('/:id/approve',
  authenticate,
  authorize([Role.manager, Role.owner]),
  returnController.approveReturn
);

router.post('/:id/reject',
  authenticate,
  authorize([Role.manager, Role.owner]),
  returnController.rejectReturn
);

router.post('/:id/attachments',
  authenticate,
  authorize([Role.manager, Role.owner, Role.supervisor]),
  upload.single('file'),
  returnController.uploadAttachment
);

export default router; 