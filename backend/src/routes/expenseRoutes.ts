import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  bulkDeleteExpenses,
  duplicateExpense,
  uploadReceipt,
  handleEmailWebhook
} from '../controllers/expenseController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Configure multer storage for receipt uploads
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images (jpeg, jpg, png) and PDFs are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

// Publicly accessible email forwarding webhook
router.post('/email-webhook', handleEmailWebhook);

// Protect all other expense routes
router.use(protect);

router.post('/', createExpense);
router.get('/', getExpenses);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);
router.post('/bulk-delete', bulkDeleteExpenses);
router.post('/:id/duplicate', duplicateExpense);

// Upload receipt and trigger mock OCR extraction
router.post('/upload-receipt', upload.single('receipt'), uploadReceipt);

export default router;
