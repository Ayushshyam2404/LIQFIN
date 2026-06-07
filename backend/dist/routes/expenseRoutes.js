"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const expenseController_1 = require("../controllers/expenseController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Configure multer storage for receipt uploads
const uploadDir = path_1.default.join(__dirname, '../../public/uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    }
    else {
        cb(new Error('Only images (jpeg, jpg, png) and PDFs are allowed'));
    }
};
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter
});
// Publicly accessible email forwarding webhook
router.post('/email-webhook', expenseController_1.handleEmailWebhook);
// Protect all other expense routes
router.use(authMiddleware_1.protect);
router.post('/', expenseController_1.createExpense);
router.get('/', expenseController_1.getExpenses);
router.put('/:id', expenseController_1.updateExpense);
router.delete('/:id', expenseController_1.deleteExpense);
router.post('/bulk-delete', expenseController_1.bulkDeleteExpenses);
router.post('/:id/duplicate', expenseController_1.duplicateExpense);
// Upload receipt and trigger mock OCR extraction
router.post('/upload-receipt', upload.single('receipt'), expenseController_1.uploadReceipt);
exports.default = router;
