import { Document, Types } from 'mongoose';

export interface IWebAuthnCredential {
  credentialID: string;
  publicKey: string;
  counter: number;
  transports?: string[];
  createdAt?: Date;
}

export interface IPushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt?: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  age?: number;
  occupation?: string;
  phone?: string;
  webAuthnCredentials?: IWebAuthnCredential[];
  pushSubscriptions?: IPushSubscription[];
  emailSyncSettings?: {
    enabled: boolean;
    host: string;
    port: number;
    secure: boolean;
    email: string;
    password?: string;
    lastSync?: Date;
  };
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

export interface IExpense extends Document {
  userId: Types.ObjectId;
  title: string;
  amount: number;
  category: string;
  paymentMethod: string; // 'cash' | 'upi' | 'debit_card' | 'credit_card' | 'bank_transfer'
  creditCardId?: Types.ObjectId | null; // if paymentMethod is 'credit_card'
  date: Date;
  notes?: string;
  receipt?: string; // receipt image filename or URL
  tags?: string[];
  createdAt: Date;
}

export interface ICreditCard extends Document {
  userId: Types.ObjectId;
  cardName: string;
  bank: string;
  creditLimit: number;
  currentBalance: number;
  statementDate: number; // day of month (1-31)
  dueDate: number;       // day of month (1-31)
  minimumPayment: number;
  annualFee: number;
  rewardsNotes?: string;
  colorTheme?: string;   // design customization
  cardNumberLastFour?: string;
  createdAt: Date;
}

export interface IBudget extends Document {
  userId: Types.ObjectId;
  category: string; // 'all' or specific category
  limit: number;
  spent: number;
  month: string; // YYYY-MM
  createdAt: Date;
}

export interface IGoal extends Document {
  userId: Types.ObjectId;
  title: string;
  targetAmount: number;
  currentAmount: number;
  category?: string; // 'emergency_fund' | 'vacation' | 'car' | 'house' | 'investment' | 'other'
  deadline: Date;
  createdAt: Date;
}

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  read: boolean;
  createdAt: Date;
}

export interface IRecurringTransaction extends Document {
  userId: Types.ObjectId;
  title: string;
  amount: number;
  category: string;
  paymentMethod: string;
  creditCardId?: Types.ObjectId | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  nextExecutionDate: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
}
