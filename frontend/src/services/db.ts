import Dexie, { type Table } from 'dexie';

export interface LocalExpense {
  id?: string; // Local uuid or MongoDB _id
  _id?: string;
  title: string;
  amount: number;
  category: string;
  paymentMethod: string;
  creditCardId?: string | null;
  date: Date | string;
  notes?: string;
  receipt?: string;
  tags?: string[];
  isOfflinePending?: boolean; // marker
}

export interface LocalCreditCard {
  id?: string;
  _id?: string;
  cardName: string;
  bank: string;
  creditLimit: number;
  currentBalance: number;
  statementDate: number;
  dueDate: number;
  minimumPayment: number;
  annualFee: number;
  rewardsNotes?: string;
  colorTheme?: string;
  cardNumberLastFour?: string;
  isOfflinePending?: boolean;
}

export interface LocalBudget {
  id?: string;
  _id?: string;
  category: string;
  limit: number;
  spent: number;
  month: string;
  isOfflinePending?: boolean;
}

export interface LocalGoal {
  id?: string;
  _id?: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  category?: string;
  deadline: Date | string;
  isOfflinePending?: boolean;
}

export interface LocalNotification {
  id?: string;
  _id?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  read: boolean;
  createdAt: Date | string;
}

export interface SyncQueueItem {
  id?: number;
  action: 'create' | 'update' | 'delete';
  type: 'expense' | 'card' | 'budget' | 'goal';
  payload?: any;
  targetId?: string; // MongoDB _id
  createdAt: number;
}

export class LIQIFINDexie extends Dexie {
  expenses!: Table<LocalExpense>;
  cards!: Table<LocalCreditCard>;
  budgets!: Table<LocalBudget>;
  goals!: Table<LocalGoal>;
  notifications!: Table<LocalNotification>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('LIQIFINDB');
    this.version(1).stores({
      expenses: '++id, _id, category, paymentMethod, date',
      cards: '++id, _id, cardName',
      budgets: '++id, _id, category, month',
      goals: '++id, _id, deadline',
      notifications: '++id, _id, read, createdAt',
      syncQueue: '++id, action, type, targetId, createdAt'
    });
  }
}

export const db = new LIQIFINDexie();
export default db;
