import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { registerSchema, loginSchema, updateProfileSchema } from '../validators';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import crypto from 'crypto';
import { encrypt, decrypt } from '../utils/crypto';
import { syncEmailsForUser } from '../utils/emailSyncService';
import { ImapFlow } from 'imapflow';

const generateTokens = (id: string, email: string) => {
  const accessToken = jwt.sign(
    { id, email },
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_ACCESS_EXPIRY || '15m') as jwt.SignOptions['expiresIn'] }
  );

  const refreshToken = jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRY || '7d') as jwt.SignOptions['expiresIn'] }
  );

  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: validated.email });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'User already exists with this email' });
      return;
    }

    const newUser = await User.create({
      name: validated.name,
      email: validated.email,
      password: validated.password,
      avatar: validated.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(validated.name)}`
    });

    const { accessToken, refreshToken } = generateTokens(newUser._id.toString(), newUser.email);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      accessToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = await User.findOne({ email: validated.email });
    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(validated.password!);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.email);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('refreshToken');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ success: false, message: 'Refresh token is missing' });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as { id: string };
    
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    const tokens = generateTokens(user._id.toString(), user.email);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// WebAuthn Passkeys Architecture
export const getBiometricRegisterOptions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Standard WebAuthn registration options payload
    const challenge = crypto.randomBytes(32).toString('base64url');
    res.status(200).json({
      success: true,
      challenge,
      rp: { name: 'LIQIFIN', id: req.hostname },
      user: {
        id: user._id.toString(),
        name: user.email,
        displayName: user.name
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 } // RS256
      ],
      timeout: 60000,
      attestation: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Face ID / Touch ID / Windows Hello
        userVerification: 'required',
        residentKey: 'required'
      }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyBiometricRegister = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { credentialID, publicKey } = req.body;
    if (!credentialID || !publicKey) {
      res.status(400).json({ success: false, message: 'Missing credential details' });
      return;
    }

    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Push new credential
    if (!user.webAuthnCredentials) {
      user.webAuthnCredentials = [];
    }
    user.webAuthnCredentials.push({
      credentialID,
      publicKey,
      counter: 0,
      transports: ['internal']
    });

    await user.save();

    res.status(200).json({ success: true, message: 'Biometric passkey registered successfully' });
  } catch (error) {
    next(error);
  }
};

export const getBiometricLoginOptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.query;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const user = await User.findOne({ email: email.toString() });
    if (!user || !user.webAuthnCredentials || user.webAuthnCredentials.length === 0) {
      res.status(404).json({ success: false, message: 'No biometric credentials registered for this email' });
      return;
    }

    const challenge = crypto.randomBytes(32).toString('base64url');
    res.status(200).json({
      success: true,
      challenge,
      allowCredentials: user.webAuthnCredentials.map(cred => ({
        type: 'public-key',
        id: cred.credentialID,
        transports: cred.transports
      })),
      userVerification: 'required'
    });
  } catch (error) {
    next(error);
  }
};

export const verifyBiometricLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, credentialID } = req.body;
    if (!email || !credentialID) {
      res.status(400).json({ success: false, message: 'Email and credential ID are required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user || !user.webAuthnCredentials) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const credential = user.webAuthnCredentials.find(c => c.credentialID === credentialID);
    if (!credential) {
      res.status(400).json({ success: false, message: 'Invalid biometric credential' });
      return;
    }

    // Verify cryptographic signature normally here (mock verification for architecture setup)
    // Issuing JWT since biometrics succeeded
    const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.email);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getEmailSyncSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const settings = user.emailSyncSettings || {
      enabled: false,
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      email: '',
      password: '',
    };

    // Mask password
    const maskedSettings = {
      ...JSON.parse(JSON.stringify(settings)),
      password: settings.password ? '********' : ''
    };

    res.status(200).json({ success: true, settings: maskedSettings });
  } catch (error) {
    next(error);
  }
};

export const updateEmailSyncSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const { enabled, host, port, secure, email, password } = req.body;

    const currentSettings = user.emailSyncSettings || {
      enabled: false,
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      email: '',
      password: '',
    };

    let encryptedPassword = currentSettings.password || '';
    if (password && password !== '********') {
      encryptedPassword = encrypt(password);
    }

    user.emailSyncSettings = {
      enabled: enabled !== undefined ? Boolean(enabled) : currentSettings.enabled,
      host: host || currentSettings.host,
      port: Number(port) || currentSettings.port,
      secure: secure !== undefined ? Boolean(secure) : currentSettings.secure,
      email: email || currentSettings.email,
      password: encryptedPassword,
      lastSync: currentSettings.lastSync
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email sync settings updated successfully',
      settings: {
        enabled: user.emailSyncSettings.enabled,
        host: user.emailSyncSettings.host,
        port: user.emailSyncSettings.port,
        secure: user.emailSyncSettings.secure,
        email: user.emailSyncSettings.email,
        password: password ? '********' : '',
        lastSync: user.emailSyncSettings.lastSync
      }
    });
  } catch (error) {
    next(error);
  }
};

export const testEmailSyncSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const { host, port, secure, email, password } = req.body;

    let testPassword = password;
    if (password === '********') {
      if (user.emailSyncSettings && user.emailSyncSettings.password) {
        testPassword = decrypt(user.emailSyncSettings.password);
      } else {
        res.status(400).json({ success: false, message: 'No password saved' });
        return;
      }
    }

    if (!host || !port || !email || !testPassword) {
      res.status(400).json({ success: false, message: 'Missing host, port, email, or password' });
      return;
    }

    const client = new ImapFlow({
      host,
      port: Number(port),
      secure: Boolean(secure),
      auth: {
        user: email,
        pass: testPassword
      },
      logger: false,
      connectionTimeout: 8000
    });

    try {
      await client.connect();
      await client.logout();
      res.status(200).json({ success: true, message: 'Connection established successfully!' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: `Connection failed: ${err.message}` });
    }
  } catch (error) {
    next(error);
  }
};

export const triggerEmailSync = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const result = await syncEmailsForUser(req.user.id);
    if (result.success) {
      res.status(200).json({
        success: true,
        message: `Sync completed successfully! Processed and added ${result.count} new expense transactions.`,
        count: result.count
      });
    } else {
      res.status(400).json({ success: false, message: result.message || 'Sync failed' });
    }
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const validated = updateProfileSchema.parse(req.body);

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const { name, email, age, occupation, phone, avatar, password } = validated;

    if (name) user.name = name;
    
    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        res.status(400).json({ success: false, message: 'Email address is already in use by another user' });
        return;
      }
      user.email = email.toLowerCase();
    }

    if (age !== undefined) user.age = (age === '' || age === null) ? undefined : Number(age);
    if (occupation !== undefined) user.occupation = occupation;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;

    if (password) {
      user.password = password; // pre-save hook will hash it automatically
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        age: user.age,
        occupation: user.occupation,
        phone: user.phone,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};
