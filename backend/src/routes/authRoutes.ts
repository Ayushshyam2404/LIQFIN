import { Router } from 'express';
import {
  register,
  login,
  logout,
  refresh,
  getMe,
  getBiometricRegisterOptions,
  verifyBiometricRegister,
  getBiometricLoginOptions,
  verifyBiometricLogin,
  getEmailSyncSettings,
  updateEmailSyncSettings,
  testEmailSyncSettings,
  triggerEmailSync,
  updateProfile
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Email Synchronization settings routes
router.get('/email-sync', protect, getEmailSyncSettings);
router.post('/email-sync', protect, updateEmailSyncSettings);
router.post('/email-sync/test', protect, testEmailSyncSettings);
router.post('/email-sync/trigger', protect, triggerEmailSync);

// Biometric passkey / WebAuthn routes
router.get('/biometrics/register-options', protect, getBiometricRegisterOptions);
router.post('/biometrics/register-verify', protect, verifyBiometricRegister);
router.get('/biometrics/login-options', getBiometricLoginOptions);
router.post('/biometrics/login-verify', verifyBiometricLogin);

export default router;
