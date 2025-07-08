import express from 'express';
import multer from 'multer';
import wasteController from '../controllers/waste.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = express.Router();

// Cấu hình multer cho upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/wastes/');
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
    // Chỉ cho phép upload ảnh
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh'));
    }
  }
});

// Routes
router.post('/',
  authenticate,
  authorize(Role.MANAGER, Role.OWNER, Role.SUPERVISOR),
  upload.array('evidencePhotos', 5), // Tối đa 5 ảnh
  wasteController.createWaste
);

router.get('/',
  authenticate,
  wasteController.getWastes
);

router.get('/report',
  authenticate,
  authorize(Role.MANAGER, Role.OWNER),
  wasteController.generateReport
);

router.get('/:id',
  authenticate,
  wasteController.getWasteById
);

router.post('/:id/approve',
  authenticate,
  authorize(Role.MANAGER, Role.OWNER),
  wasteController.approveWaste
);

router.post('/:id/reject',
  authenticate,
  authorize(Role.MANAGER, Role.OWNER),
  wasteController.rejectWaste
);

export default router; 