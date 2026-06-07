import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

const WebAuthnCredentialSchema = new Schema({
  credentialID: { type: String, required: true },
  publicKey: { type: String, required: true },
  counter: { type: Number, required: true, default: 0 },
  transports: [String],
  createdAt: { type: Date, default: Date.now }
});

const PushSubscriptionSchema = new Schema({
  endpoint: { type: String, required: true },
  expirationTime: { type: Number, default: null },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  createdAt: { type: Date, default: Date.now }
});

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  age: { type: Number, default: null },
  occupation: { type: String, default: '' },
  phone: { type: String, default: '' },
  webAuthnCredentials: [WebAuthnCredentialSchema],
  pushSubscriptions: [PushSubscriptionSchema],
  emailSyncSettings: {
    enabled: { type: Boolean, default: false },
    host: { type: String, default: 'imap.gmail.com' },
    port: { type: Number, default: 993 },
    secure: { type: Boolean, default: true },
    email: { type: String, default: '' },
    password: { type: String, default: '' },
    lastSync: { type: Date }
  },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
UserSchema.pre('save', function (next) {
  if (!this.password || !this.isModified('password')) return next();
  try {
    const salt = bcrypt.genSaltSync(10);
    this.password = bcrypt.hashSync(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password || '');
};

export const User = model<IUser>('User', UserSchema);
