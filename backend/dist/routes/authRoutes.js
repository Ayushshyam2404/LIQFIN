"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.post('/logout', authController_1.logout);
router.post('/refresh', authController_1.refresh);
router.get('/me', authMiddleware_1.protect, authController_1.getMe);
router.put('/profile', authMiddleware_1.protect, authController_1.updateProfile);
// Email Synchronization settings routes
router.get('/email-sync', authMiddleware_1.protect, authController_1.getEmailSyncSettings);
router.post('/email-sync', authMiddleware_1.protect, authController_1.updateEmailSyncSettings);
router.post('/email-sync/test', authMiddleware_1.protect, authController_1.testEmailSyncSettings);
router.post('/email-sync/trigger', authMiddleware_1.protect, authController_1.triggerEmailSync);
// Biometric passkey / WebAuthn routes
router.get('/biometrics/register-options', authMiddleware_1.protect, authController_1.getBiometricRegisterOptions);
router.post('/biometrics/register-verify', authMiddleware_1.protect, authController_1.verifyBiometricRegister);
router.get('/biometrics/login-options', authController_1.getBiometricLoginOptions);
router.post('/biometrics/login-verify', authController_1.verifyBiometricLogin);
exports.default = router;
