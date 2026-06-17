import { create } from 'zustand';
import { api } from '../services/api';
import { db, LocalExpense, LocalCreditCard, LocalBudget, LocalGoal, LocalNotification } from '../services/db';
import { getCurrentYearMonth } from '../utils/dateHelpers';
import { offlineCreate, offlineEdit, offlineDelete, offlineFetch, isLocalId } from '../utils/offlineSync';

interface FinanceState {
  expenses: LocalExpense[];
  cards: LocalCreditCard[];
  budgets: LocalBudget[];
  goals: LocalGoal[];
  notifications: LocalNotification[];
  aiInsights: any | null;
  dashboardStats: any | null;
  
  isOffline: boolean;
  isSyncing: boolean;
  isLoading: boolean;
  
  setOffline: (status: boolean) => void;
  syncOfflineData: () => Promise<void>;
  
  // Dashboard & AI
  fetchDashboard: () => Promise<void>;
  fetchAIInsights: () => Promise<void>;
  
  // Expenses
  fetchExpenses: (filters?: any) => Promise<void>;
  addExpense: (expense: Omit<LocalExpense, 'id' | '_id'>) => Promise<boolean>;
  editExpense: (id: string, expense: Partial<LocalExpense>) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<boolean>;
  deleteExpensesBulk: (ids: string[]) => Promise<boolean>;
  duplicateExpense: (id: string) => Promise<boolean>;
  uploadReceipt: (formData: FormData) => Promise<any>;

  // Credit Cards
  fetchCards: () => Promise<void>;
  addCard: (card: Omit<LocalCreditCard, 'id' | '_id'>) => Promise<boolean>;
  editCard: (id: string, card: Partial<LocalCreditCard>) => Promise<boolean>;
  deleteCard: (id: string) => Promise<boolean>;

  // Budgets
  fetchBudgets: (month?: string) => Promise<void>;
  createOrUpdateBudget: (budget: Omit<LocalBudget, 'id' | '_id'>) => Promise<boolean>;
  deleteBudget: (id: string) => Promise<boolean>;

  // Goals
  fetchGoals: () => Promise<void>;
  addGoal: (goal: Omit<LocalGoal, 'id' | '_id'>) => Promise<boolean>;
  editGoal: (id: string, goal: Partial<LocalGoal>) => Promise<boolean>;
  deleteGoal: (id: string) => Promise<boolean>;
  addFundsToGoal: (id: string, amount: number) => Promise<boolean>;

  // Notifications
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<boolean>;
  markAllNotificationsRead: () => Promise<boolean>;
  clearNotifications: () => Promise<boolean>;
}

export const useFinanceStore = create<FinanceState>((set, get) => {
  // Setup online/offline listeners
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      set({ isOffline: false });
      get().syncOfflineData();
    });
    window.addEventListener('offline', () => {
      set({ isOffline: true });
    });
  }

  const isOnline = () => !get().isOffline && navigator.onLine;

  return {
    expenses: [],
    cards: [],
    budgets: [],
    goals: [],
    notifications: [],
    aiInsights: null,
    dashboardStats: null,
    isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    isSyncing: false,
    isLoading: false,

    setOffline: (status) => set({ isOffline: status }),

    syncOfflineData: async () => {
      if (!isOnline() || get().isSyncing) return;
      
      const queue = await db.syncQueue.orderBy('createdAt').toArray();
      if (queue.length === 0) return;

      set({ isSyncing: true });
      console.log(`Syncing ${queue.length} offline operations...`);

      for (const item of queue) {
        try {
          if (item.type === 'expense') {
            if (item.action === 'create') {
              const res = await api.post('/expenses', item.payload);
              // Update local Dexie with DB details
              if (res.data.success && item.payload.tempId) {
                const localItem = await db.expenses.where('id').equals(item.payload.tempId).first();
                if (localItem) {
                  await db.expenses.delete(item.payload.tempId);
                  localItem._id = res.data.expense._id;
                  localItem.id = res.data.expense._id;
                  delete localItem.isOfflinePending;
                  await db.expenses.add(localItem);
                }
              }
            } else if (item.action === 'update' && item.targetId) {
              await api.put(`/expenses/${item.targetId}`, item.payload);
            } else if (item.action === 'delete' && item.targetId) {
              await api.delete(`/expenses/${item.targetId}`);
            }
          } else if (item.type === 'card') {
            if (item.action === 'create') {
              const res = await api.post('/cards', item.payload);
              if (res.data.success && item.payload.tempId) {
                const localCard = await db.cards.where('id').equals(item.payload.tempId).first();
                if (localCard) {
                  await db.cards.delete(item.payload.tempId);
                  localCard._id = res.data.card._id;
                  localCard.id = res.data.card._id;
                  delete localCard.isOfflinePending;
                  await db.cards.add(localCard);
                }
              }
            } else if (item.action === 'update' && item.targetId) {
              await api.put(`/cards/${item.targetId}`, item.payload);
            } else if (item.action === 'delete' && item.targetId) {
              await api.delete(`/cards/${item.targetId}`);
            }
          } else if (item.type === 'budget') {
            if (item.action === 'create') {
              await api.post('/budgets', item.payload);
            } else if (item.action === 'delete' && item.targetId) {
              await api.delete(`/budgets/${item.targetId}`);
            }
          } else if (item.type === 'goal') {
            if (item.action === 'create') {
              const res = await api.post('/goals', item.payload);
              if (res.data.success && item.payload.tempId) {
                const localGoal = await db.goals.where('id').equals(item.payload.tempId).first();
                if (localGoal) {
                  await db.goals.delete(item.payload.tempId);
                  localGoal._id = res.data.goal._id;
                  localGoal.id = res.data.goal._id;
                  delete localGoal.isOfflinePending;
                  await db.goals.add(localGoal);
                }
              }
            } else if (item.action === 'update' && item.targetId) {
              await api.put(`/goals/${item.targetId}`, item.payload);
            } else if (item.action === 'delete' && item.targetId) {
              await api.delete(`/goals/${item.targetId}`);
            }
          }

          // Delete queue item on success
          if (item.id !== undefined) {
            await db.syncQueue.delete(item.id);
          }
        } catch (err) {
          console.error(`Failed to sync item ${item.id} of type ${item.type}:`, err);
          // Stop sync loop to prevent out-of-order execution, try again later
          break;
        }
      }

      set({ isSyncing: false });
      // Re-trigger general fetch to lock in DB states
      get().fetchDashboard();
    },

    // ----------------------------------------------------
    // DASHBOARD & AI ASSISTANT
    // ----------------------------------------------------
    fetchDashboard: async () => {
      set({ isLoading: true });
      if (isOnline()) {
        try {
          const res = await api.get('/dashboard/stats');
          if (res.data.success) {
            set({ 
              dashboardStats: {
                ...res.data.stats,
                charts: res.data.charts
              },
              isLoading: false 
            });
            
            // Sync to Dexie (Cache) in background
            await db.expenses.clear();
            await db.cards.clear();
            await db.notifications.clear();
            
            // Re-fetch everything to fill IndexedDB
            await get().fetchExpenses();
            await get().fetchCards();
            await get().fetchNotifications();
            await get().fetchGoals();
            await get().fetchBudgets();
            return;
          }
        } catch (err) {
          console.error('Failed to fetch dashboard online, using local cache:', err);
        }
      }

      // Offline Fallback calculations
      const localExp = await db.expenses.toArray();
      const localCrd = await db.cards.toArray();
      const localGls = await db.goals.toArray();
      
      const totalExpense = localExp.reduce((sum, item) => sum + item.amount, 0);
      let totalCreditBalance = 0;
      let totalCreditLimit = 0;
      localCrd.forEach(card => {
        totalCreditLimit += card.creditLimit;
        totalCreditBalance += card.currentBalance;
      });

      const totalSavingsCurrent = localGls.reduce((sum, item) => sum + item.currentAmount, 0);
      const totalSavingsTarget = localGls.reduce((sum, item) => sum + item.targetAmount, 0);

      // Compute category breakdown based on offline records
      const categoryMap: Record<string, number> = {};
      localExp.forEach(e => {
        categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
      });
      const categoryBreakdown = Object.keys(categoryMap).map(name => ({
        name,
        value: categoryMap[name]
      })).sort((a, b) => b.value - a.value);

      // Compute trends (e.g. group by month)
      const trendsMap: Record<string, { expenses: number; income: number }> = {};
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      localExp.forEach(e => {
        const d = new Date(e.date);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        if (!trendsMap[key]) {
          trendsMap[key] = { expenses: 0, income: 8500.00 };
        }
        trendsMap[key].expenses += e.amount;
      });

      const spendingTrends = Object.keys(trendsMap).map(name => ({
        name,
        expenses: parseFloat(trendsMap[name].expenses.toFixed(2)),
        income: trendsMap[name].income
      }));

      // Compute statistics based on offline records
      const offlineStats = {
        totalBalance: 12500.00 - totalCreditBalance,
        monthlyExpenses: totalExpense,
        prevMonthlyExpenses: totalExpense * 0.9, // mock trend
        monthlyIncome: 8500.00,
        netWorth: (12500.00 + totalSavingsCurrent) - totalCreditBalance,
        savingsRate: 8500.00 > 0 ? ((8500.00 - totalExpense) / 8500.00) * 100 : 0,
        creditUtilization: totalCreditLimit > 0 ? (totalCreditBalance / totalCreditLimit) * 100 : 0,
        totalCreditLimit,
        totalCreditBalance,
        activeGoalsCount: localGls.length,
        totalSavingsCurrent,
        totalSavingsTarget,
        charts: {
          categoryBreakdown,
          spendingTrends
        }
      };
      
      set({ dashboardStats: offlineStats, isLoading: false });
    },

    fetchAIInsights: async () => {
      if (isOnline()) {
        try {
          const res = await api.get('/ai/insights');
          if (res.data.success) {
            set({ aiInsights: res.data.analysis });
            return;
          }
        } catch (err) {
          console.error('AI Insights online fail, serving mock offline advice:', err);
        }
      }

      // Offline AI Response
      set({
        aiInsights: {
          summary: 'LIQIFIN Offline AI. Reconnect to sync ledger details for deep analytics.',
          insights: [
            'Offline mode active. Expenses are saved locally and will auto-sync once internet resumes.',
            'Review category limits to remain on budget.'
          ],
          suggestions: [
            'Reconnect to internet for AI spending summaries.',
            'Create category budgets for Shopping or Dining.'
          ],
          generatedAt: new Date()
        }
      });
    },

    // ----------------------------------------------------
    // EXPENSES METHODS
    // ----------------------------------------------------
    fetchExpenses: async (filters = {}) => {
      if (isOnline()) {
        try {
          const res = await api.get('/expenses', { params: filters });
          if (res.data.success) {
            const fetched = res.data.expenses.map((e: any) => ({
              ...e,
              id: e._id
            }));
            set({ expenses: fetched });
            
            // Cache to Dexie
            for (const item of fetched) {
              const exists = await db.expenses.where('_id').equals(item._id).first();
              if (!exists) {
                await db.expenses.put(item);
              }
            }
            return;
          }
        } catch (err) {
          console.error('Fetch expenses online failed, fallback to offline local stores:', err);
        }
      }

      // Offline retrieval
      const local = await db.expenses.toArray();
      set({ expenses: local });
    },

    addExpense: async (expense) => {
      const tempId = 'local_' + Math.random().toString(36).substring(2);
      const newLocal: LocalExpense = {
        ...expense,
        id: tempId,
        isOfflinePending: true
      };

      // Push locally first
      await db.expenses.add(newLocal);
      set((state) => ({ expenses: [newLocal, ...state.expenses] }));

      // Sync budget locally (add to categories)
      const currentBudgets = [...get().budgets];
      const categoryBudget = currentBudgets.find(b => b.category === expense.category);
      if (categoryBudget) {
        categoryBudget.spent += expense.amount;
        await db.budgets.update(categoryBudget.id || categoryBudget._id, { spent: categoryBudget.spent });
      }
      const totalBudget = currentBudgets.find(b => b.category === 'all');
      if (totalBudget) {
        totalBudget.spent += expense.amount;
        await db.budgets.update(totalBudget.id || totalBudget._id, { spent: totalBudget.spent });
      }
      set({ budgets: currentBudgets });

      // Sync credit card balance locally
      if (expense.paymentMethod === 'credit_card' && expense.creditCardId) {
        const currentCards = [...get().cards];
        const card = currentCards.find(c => c.id === expense.creditCardId || c._id === expense.creditCardId);
        if (card) {
          card.currentBalance += expense.amount;
          await db.cards.update(card.id || card._id, { currentBalance: card.currentBalance });
        }
        set({ cards: currentCards });
      }

      if (isOnline()) {
        try {
          const res = await api.post('/expenses', expense);
          if (res.data.success) {
            // Swap temp item with actual DB item
            await db.expenses.delete(tempId);
            const saved = { ...res.data.expense, id: res.data.expense._id };
            await db.expenses.add(saved);

            set((state) => ({
              expenses: state.expenses.map((e) => (e.id === tempId ? saved : e))
            }));
            
            get().fetchDashboard(); // update totals
            return true;
          }
        } catch (err) {
          console.log('Online save failed, queued in offline sync queue.');
        }
      }

      // Add to offline queue
      await db.syncQueue.add({
        action: 'create',
        type: 'expense',
        payload: { ...expense, tempId },
        createdAt: Date.now()
      });

      return true;
    },

    editExpense: async (id, expense) => {
      const expId = id;
      const isLocal = expId.startsWith('local_');

      // Update Dexie and local memory state
      const existing = await db.expenses.get(expId);
      if (!existing) return false;

      const updatedLocal = { ...existing, ...expense };
      await db.expenses.put(updatedLocal);
      
      set((state) => ({
        expenses: state.expenses.map((e) => (e.id === expId ? updatedLocal : e))
      }));

      if (isOnline() && !isLocal) {
        try {
          const res = await api.put(`/expenses/${expId}`, expense);
          if (res.data.success) {
            get().fetchDashboard();
            return true;
          }
        } catch (err) {
          console.log('Online edit failed, queued locally.');
        }
      }

      if (!isLocal) {
        await db.syncQueue.add({
          action: 'update',
          type: 'expense',
          targetId: expId,
          payload: expense,
          createdAt: Date.now()
        });
      }

      return true;
    },

    deleteExpense: async (id) => {
      const expId = id;
      const isLocal = expId.startsWith('local_');

      const existing = await db.expenses.get(expId);
      if (!existing) return false;

      // Delete locally
      await db.expenses.delete(expId);
      set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== expId)
      }));

      // Adjust budgets locally
      const currentBudgets = [...get().budgets];
      const categoryBudget = currentBudgets.find(b => b.category === existing.category);
      if (categoryBudget) {
        categoryBudget.spent = Math.max(0, categoryBudget.spent - existing.amount);
        await db.budgets.update(categoryBudget.id || categoryBudget._id, { spent: categoryBudget.spent });
      }
      const totalBudget = currentBudgets.find(b => b.category === 'all');
      if (totalBudget) {
        totalBudget.spent = Math.max(0, totalBudget.spent - existing.amount);
        await db.budgets.update(totalBudget.id || totalBudget._id, { spent: totalBudget.spent });
      }
      set({ budgets: currentBudgets });

      // Adjust credit card balances locally
      if (existing.paymentMethod === 'credit_card' && existing.creditCardId) {
        const currentCards = [...get().cards];
        const card = currentCards.find(c => c.id === existing.creditCardId || c._id === existing.creditCardId);
        if (card) {
          card.currentBalance = Math.max(0, card.currentBalance - existing.amount);
          await db.cards.update(card.id || card._id, { currentBalance: card.currentBalance });
        }
        set({ cards: currentCards });
      }

      if (isOnline() && !isLocal) {
        try {
          const res = await api.delete(`/expenses/${expId}`);
          if (res.data.success) {
            get().fetchDashboard();
            return true;
          }
        } catch (err) {
          console.log('Online delete failed, queued locally.');
        }
      }

      if (!isLocal) {
        await db.syncQueue.add({
          action: 'delete',
          type: 'expense',
          targetId: expId,
          createdAt: Date.now()
        });
      }

      return true;
    },

    deleteExpensesBulk: async (ids) => {
      set({ isLoading: true });
      for (const id of ids) {
        await get().deleteExpense(id);
      }
      set({ isLoading: false });
      return true;
    },

    duplicateExpense: async (id) => {
      const existing = await db.expenses.get(id);
      if (!existing) return false;

      const duplicatePayload = {
        title: `${existing.title} (Copy)`,
        amount: existing.amount,
        category: existing.category,
        paymentMethod: existing.paymentMethod,
        creditCardId: existing.creditCardId,
        date: new Date(),
        notes: existing.notes,
        tags: existing.tags
      };

      return get().addExpense(duplicatePayload);
    },

    uploadReceipt: async (formData) => {
      if (!isOnline()) {
        throw new Error('Internet connection required for receipt AI OCR scanning.');
      }
      const res = await api.post('/expenses/upload-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },

    // ----------------------------------------------------
    // CREDIT CARDS
    // ----------------------------------------------------
    fetchCards: async () => {
      const cards = await offlineFetch<LocalCreditCard>({
        table: db.cards,
        apiPath: '/cards',
        responseKey: 'cards',
        isOnline
      });
      set({ cards });
    },

    addCard: async (card) => {
      const { success, record } = await offlineCreate<LocalCreditCard>({
        table: db.cards,
        apiPath: '/cards',
        type: 'card',
        payload: card,
        responseKey: 'card',
        isOnline
      });

      if (success) {
        set((state) => ({
          cards: state.cards.some(c => c.id === record.id)
            ? state.cards.map(c => c.id === record.id ? record : c)
            : [record, ...state.cards]
        }));
      }
      return success;
    },

    editCard: async (id, card) => {
      const { success, record } = await offlineEdit<LocalCreditCard>({
        table: db.cards,
        apiPath: '/cards',
        type: 'card',
        id,
        updates: card,
        isOnline
      });

      if (success && record) {
        set((state) => ({
          cards: state.cards.map((c) => (c.id === id ? record : c))
        }));
      }
      return success;
    },

    deleteCard: async (id) => {
      const success = await offlineDelete<LocalCreditCard>({
        table: db.cards,
        apiPath: '/cards',
        type: 'card',
        id,
        isOnline
      });

      if (success) {
        set((state) => ({ cards: state.cards.filter((c) => c.id !== id) }));
      }
      return success;
    },

    // ----------------------------------------------------
    // BUDGETS
    // ----------------------------------------------------
    fetchBudgets: async (month) => {
      const targetMonth = month || getCurrentYearMonth();

      if (isOnline()) {
        try {
          const res = await api.get(`/budgets?month=${targetMonth}`);
          if (res.data.success) {
            const mapped = res.data.budgets.map((b: any) => ({ ...b, id: b._id }));
            set({ budgets: mapped });
            
            await db.budgets.clear();
            for (const b of mapped) {
              await db.budgets.put(b);
            }
            return;
          }
        } catch (err) {
          console.error(err);
        }
      }

      const local = await db.budgets.toArray();
      set({ budgets: local.filter(b => b.month === targetMonth) });
    },

    createOrUpdateBudget: async (budget) => {
      // Find local budget first
      const existing = await db.budgets.where({ category: budget.category, month: budget.month }).first();
      const localId = existing?.id || 'local_' + Math.random().toString(36).substring(2);

      const localB: LocalBudget = {
        ...budget,
        id: localId,
        spent: existing?.spent || 0
      };

      await db.budgets.put(localB);
      
      if (existing) {
        set((state) => ({
          budgets: state.budgets.map((b) => (b.id === existing.id ? localB : b))
        }));
      } else {
        set((state) => ({ budgets: [...state.budgets, localB] }));
      }

      if (isOnline()) {
        try {
          const res = await api.post('/budgets', budget);
          if (res.data.success) {
            await db.budgets.delete(localId);
            const saved = { ...res.data.budget, id: res.data.budget._id };
            await db.budgets.put(saved);
            
            set((state) => ({
              budgets: state.budgets.map((b) => (b.id === localId ? saved : b))
            }));
            return true;
          }
        } catch (err) {
          console.log(err);
        }
      }

      await db.syncQueue.add({
        action: 'create',
        type: 'budget',
        payload: budget,
        createdAt: Date.now()
      });

      return true;
    },

    deleteBudget: async (id) => {
      const success = await offlineDelete<LocalBudget>({
        table: db.budgets,
        apiPath: '/budgets',
        type: 'budget',
        id,
        isOnline
      });

      if (success) {
        set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) }));
      }
      return success;
    },

    // ----------------------------------------------------
    // GOALS
    // ----------------------------------------------------
    fetchGoals: async () => {
      const goals = await offlineFetch<LocalGoal>({
        table: db.goals,
        apiPath: '/goals',
        responseKey: 'goals',
        isOnline
      });
      set({ goals });
    },

    addGoal: async (goal) => {
      const { success, record } = await offlineCreate<LocalGoal>({
        table: db.goals,
        apiPath: '/goals',
        type: 'goal',
        payload: goal,
        responseKey: 'goal',
        isOnline
      });

      if (success) {
        set((state) => ({
          goals: state.goals.some(g => g.id === record.id)
            ? state.goals.map(g => g.id === record.id ? record : g)
            : [...state.goals, record]
        }));
      }
      return success;
    },

    editGoal: async (id, goal) => {
      const { success, record } = await offlineEdit<LocalGoal>({
        table: db.goals,
        apiPath: '/goals',
        type: 'goal',
        id,
        updates: goal,
        isOnline
      });

      if (success && record) {
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? record : g))
        }));
      }
      return success;
    },

    deleteGoal: async (id) => {
      const success = await offlineDelete<LocalGoal>({
        table: db.goals,
        apiPath: '/goals',
        type: 'goal',
        id,
        isOnline
      });

      if (success) {
        set((state) => ({ goals: state.goals.filter((g) => g.id !== id) }));
      }
      return success;
    },

    addFundsToGoal: async (id, amount) => {
      const existing = await db.goals.get(id);
      if (!existing) return false;

      const updatedAmount = existing.currentAmount + amount;
      await db.goals.update(id, { currentAmount: updatedAmount });

      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? { ...g, currentAmount: updatedAmount } : g))
      }));

      if (isOnline() && !isLocalId(id)) {
        try {
          const res = await api.post(`/goals/${id}/add-funds`, { amount });
          if (res.data.success) {
            get().fetchDashboard();
            return true;
          }
        } catch (err) {
          console.log(err);
        }
      }

      if (!isLocalId(id)) {
        await db.syncQueue.add({
          action: 'update',
          type: 'goal',
          targetId: id,
          payload: { currentAmount: updatedAmount },
          createdAt: Date.now()
        });
      }

      return true;
    },

    // ----------------------------------------------------
    // NOTIFICATIONS
    // ----------------------------------------------------
    fetchNotifications: async () => {
      const notifications = await offlineFetch<LocalNotification>({
        table: db.notifications,
        apiPath: '/notifications',
        responseKey: 'notifications',
        isOnline
      });
      set({ notifications });
    },

    markNotificationRead: async (id) => {
      const notifId = id;
      
      await db.notifications.update(notifId, { read: true });
      set((state) => ({
        notifications: state.notifications.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      }));

      if (isOnline()) {
        try {
          await api.put(`/notifications/${notifId}/read`);
          return true;
        } catch (err) {
          console.error(err);
        }
      }

      return true;
    },

    markAllNotificationsRead: async () => {
      const unread = get().notifications.filter(n => !n.read);
      for (const n of unread) {
        await db.notifications.update(n.id || n._id, { read: true });
      }
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true }))
      }));

      if (isOnline()) {
        try {
          await api.post('/notifications/read-all');
          return true;
        } catch (err) {
          console.error(err);
        }
      }
      return true;
    },

    clearNotifications: async () => {
      await db.notifications.clear();
      set({ notifications: [] });

      if (isOnline()) {
        try {
          await api.delete('/notifications/clear');
          return true;
        } catch (err) {
          console.error(err);
        }
      }
      return true;
    }
  };
});
