import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Target, 
  Plus, 
  Trash2, 
  PiggyBank, 
  X, 
  AlertTriangle, 
  Percent
} from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { CardSkeleton } from '../components/ui/Loading';
import { EmptyState } from '../components/ui/EmptyState';

const goalFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  targetAmount: z.coerce.number().positive('Target must be greater than zero'),
  currentAmount: z.coerce.number().nonnegative().optional(),
  deadline: z.string().min(1, 'Deadline is required'),
  category: z.string().optional()
});

const budgetFormSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  limit: z.coerce.number().positive('Limit must be greater than zero'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM')
});

type GoalFormValues = z.infer<typeof goalFormSchema>;
type BudgetFormValues = z.infer<typeof budgetFormSchema>;

export const GoalsPage: React.FC = () => {
  const { 
    goals, 
    budgets, 
    fetchGoals, 
    fetchBudgets, 
    addGoal, 
    deleteGoal, 
    addFundsToGoal,
    createOrUpdateBudget, 
    deleteBudget,
    isLoading
  } = useFinanceStore();

  const { formatCurrency, getCurrencySymbol } = useSettingsStore();

  const [isGoalOpen, setIsGoalOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState(100);

  const categories = [
    'Food', 'Groceries', 'Travel', 'Transportation', 'Entertainment', 
    'Shopping', 'Bills', 'Healthcare', 'Education', 'Rent', 'Utilities', 
    'Investments', 'Miscellaneous'
  ];

  const currentMonthString = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  useEffect(() => {
    fetchGoals();
    fetchBudgets(currentMonthString);
  }, []);

  const goalForm = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: '',
      targetAmount: 1000,
      currentAmount: 0,
      deadline: '',
      category: 'Investments'
    }
  });

  const budgetForm = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      category: 'Food',
      limit: 500,
      month: currentMonthString
    }
  });

  const onGoalSubmit = async (data: GoalFormValues) => {
    const success = await addGoal({
      title: data.title,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount ?? 0,
      category: data.category ?? 'Investments',
      deadline: new Date(data.deadline)
    });
    if (success) {
      setIsGoalOpen(false);
      goalForm.reset();
    }
  };

  const onBudgetSubmit = async (data: BudgetFormValues) => {
    const success = await createOrUpdateBudget({
      category: data.category,
      limit: data.limit,
      spent: 0,
      month: data.month
    });
    if (success) {
      setIsBudgetOpen(false);
      budgetForm.reset();
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (confirm('Are you sure you want to remove this savings goal?')) {
      await deleteGoal(id);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (confirm('Are you sure you want to delete this category limit?')) {
      await deleteBudget(id);
    }
  };

  const handleDepositFunds = async () => {
    if (depositGoalId && depositAmount > 0) {
      const success = await addFundsToGoal(depositGoalId, depositAmount);
      if (success) {
        setDepositGoalId(null);
        setDepositAmount(100);
      }
    }
  };

  return (
    <div className="space-y-8">
      
      {/* SECTION 1: BUDGET CAPS */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-brand-on-surface uppercase tracking-tight flex items-center gap-2 font-mono">
              <Percent className="w-5 h-5 text-brand-primary" />
              <span>CATEGORY_BUDGETS</span>
            </h2>
            <p className="text-[11px] text-brand-outline font-medium">Control spending limits across transactional categories.</p>
          </div>
          <button
            onClick={() => setIsBudgetOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 border-2 border-brand-on-surface font-mono text-xs font-black uppercase bg-brand-primary text-white shadow-[4px_4px_0px_0px_rgba(27,27,27,1)] pressed-state cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Set Limit Cap</span>
          </button>
        </div>

        {/* Budgets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((b) => {
            const bId = (b.id || b._id) as string;
            const percent = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
            const isOverspent = b.spent > b.limit;
            return (
              <div key={bId} className="bg-brand-surface-lowest border-4 border-brand-on-surface p-5 shadow-[4px_4px_0px_0px_var(--border-color)] flex flex-col justify-between hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--border-color)] transition-all relative">
                
                {/* Header card details */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-xs font-black text-brand-on-surface uppercase tracking-tight font-mono">{b.category === 'all' ? 'Monthly Outflow Total' : b.category}</h4>
                    <span className="text-[8px] font-mono text-brand-outline font-extrabold uppercase">{b.month}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteBudget(bId)}
                    className="p-1 border-2 border-brand-on-surface bg-brand-surface-lowest hover:bg-brand-surface rounded-none shadow-[1px_1px_0px_0px_var(--border-color)] pressed-state cursor-pointer text-brand-on-surface"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress elements */}
                <div className="space-y-3 font-mono text-[10px] font-bold">
                  <div className="flex justify-between items-end">
                    <span className="text-brand-outline">SPENT: <b className="text-brand-on-surface font-black">{formatCurrency(b.spent)}</b></span>
                    <span className="text-brand-outline">CAP: <b className="text-brand-on-surface font-black">{formatCurrency(b.limit)}</b></span>
                  </div>

                  <div className="h-4 w-full bg-slate-100 border-2 border-brand-on-surface rounded-none overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isOverspent ? 'bg-rose-500' : percent >= 80 ? 'bg-amber-400' : 'bg-brand-primary-container'
                      }`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center font-black">
                    <span className={`${isOverspent ? 'text-rose-600' : 'text-brand-on-surface'}`}>
                      {percent.toFixed(0)}% EXHAUSTED
                    </span>
                    {isOverspent && (
                      <span className="flex items-center gap-0.5 text-[8px] text-white bg-rose-500 border border-brand-on-surface px-1.5 py-0.5 sticker-rotate-left">
                        OVER_LIMIT
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {budgets.length === 0 && (
            <div className="col-span-full py-16 text-center border-4 border-dashed border-brand-on-surface bg-brand-surface-lowest neo-shadow-md space-y-2">
              <AlertTriangle className="w-8 h-8 text-brand-outline mx-auto" />
              <p className="font-mono text-xs font-bold text-brand-outline">NO BUDGET CAPS DEFINED FOR THIS MONTH</p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: SAVINGS TARGETS */}
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-brand-on-surface uppercase tracking-tight flex items-center gap-2 font-mono">
              <PiggyBank className="w-5 h-5 text-brand-secondary" />
              <span>SAVINGS_TARGETS</span>
            </h2>
            <p className="text-[11px] text-brand-outline font-medium">Build capital reserves and monitor milestones.</p>
          </div>
          <button
            onClick={() => setIsGoalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 border-2 border-brand-on-surface font-mono text-xs font-black uppercase bg-brand-primary text-white shadow-[4px_4px_0px_0px_var(--border-color)] pressed-state cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Goal Target</span>
          </button>
        </div>

        {/* Goals Grid with Skeletons / Empty State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="NO ACTIVE SAVINGS TARGETS FOUND"
            description="Build reserves, fund future dreams, or set up emergency caches. Create your first goal to track progress."
            actionText="Create Goal Target"
            onActionClick={() => setIsGoalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((g) => {
              const gId = (g.id || g._id) as string;
              const percent = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
              const isCompleted = g.currentAmount >= g.targetAmount;
              return (
                <div key={gId} className="bg-brand-surface-lowest border-4 border-brand-on-surface p-5 shadow-[4px_4px_0px_0px_var(--border-color)] flex flex-col justify-between hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--border-color)] transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-xs font-black text-brand-on-surface uppercase font-mono">{g.title}</h4>
                      <span className="text-[8px] border border-brand-on-surface px-1.5 py-0.5 bg-brand-tertiary-fixed font-mono font-bold uppercase">{g.category}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(gId)}
                      className="p-1 border-2 border-brand-on-surface bg-brand-surface-lowest hover:bg-brand-surface shadow-[1px_1px_0px_0px_var(--border-color)] pressed-state cursor-pointer text-brand-on-surface"
                      aria-label={`Delete goal ${g.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3 font-mono text-[10px] font-bold">
                    <div className="flex justify-between items-end">
                      <span className="text-brand-outline">CURRENT: <b className="text-brand-on-surface font-black">{formatCurrency(g.currentAmount, { precision: 0 })}</b></span>
                      <span className="text-brand-outline">TARGET: <b className="text-brand-on-surface font-black">{formatCurrency(g.targetAmount, { precision: 0 })}</b></span>
                    </div>

                    <div className="h-4 w-full bg-slate-100 border-2 border-brand-on-surface rounded-none overflow-hidden">
                      <div
                        className="h-full bg-brand-secondary-fixed transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center font-black">
                      <span className="text-brand-on-surface">{percent.toFixed(0)}% REACHED</span>
                      {isCompleted ? (
                        <span className="text-[8px] bg-brand-secondary-fixed border border-brand-on-surface px-2 py-0.5 sticker-rotate-right">COMPLETED</span>
                      ) : (
                        <span className="text-[8px] text-brand-outline">TARGET: {g.deadline ? new Date(g.deadline).toLocaleDateString([], { month: 'short', year: 'numeric' }) : 'No Date'}</span>
                      )}
                    </div>

                    <div className="pt-2 border-t-2 border-brand-on-surface flex gap-2">
                      <button
                        onClick={() => setDepositGoalId(gId)}
                        className="w-full py-1.5 border-2 border-brand-on-surface bg-brand-surface-lowest text-[9px] font-black uppercase flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_var(--border-color)] pressed-state cursor-pointer text-brand-on-surface"
                      >
                        <PiggyBank className="w-3.5 h-3.5 text-brand-secondary" />
                        <span>Deposit Funds</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE TARGET MODAL */}
      {isGoalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsGoalOpen(false)} />
          <div className="relative w-full max-w-sm bg-brand-surface-lowest border-4 border-brand-on-surface shadow-[8px_8px_0px_0px_var(--border-color)] z-50 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b-4 border-brand-on-surface bg-brand-on-surface text-white">
              <h3 className="font-extrabold text-sm uppercase font-mono">NEW_SAVINGS_TARGET</h3>
              <button onClick={() => setIsGoalOpen(false)} className="p-1 text-white hover:text-rose-400 cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={goalForm.handleSubmit(onGoalSubmit)} className="p-6 space-y-4 font-sans">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Target Title</label>
                <input
                  type="text"
                  placeholder="e.g. Vacation Fund"
                  {...goalForm.register('title')}
                  className="w-full px-3 py-2 neo-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Target ({getCurrencySymbol()})</label>
                  <input
                    type="number"
                    {...goalForm.register('targetAmount')}
                    className="w-full px-3 py-2 neo-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Initial ({getCurrencySymbol()})</label>
                  <input
                    type="number"
                    {...goalForm.register('currentAmount')}
                    className="w-full px-3 py-2 neo-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Category</label>
                  <select
                    {...goalForm.register('category')}
                    className="w-full px-3 py-2 neo-input"
                  >
                    <option value="emergency_fund">Emergency</option>
                    <option value="vacation">Vacation</option>
                    <option value="car">Car downpayment</option>
                    <option value="house">House fund</option>
                    <option value="investment">Investments</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Deadline</label>
                  <input
                    type="date"
                    {...goalForm.register('deadline')}
                    className="w-full px-3 py-2 neo-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 border-2 border-brand-on-surface bg-brand-primary text-white font-black uppercase shadow-[4px_4px_0px_0px_var(--border-color)] pressed-state cursor-pointer"
              >
                Create Target
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SET BUDGET MODAL */}
      {isBudgetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsBudgetOpen(false)} />
          <div className="relative w-full max-w-sm bg-brand-surface-lowest border-4 border-brand-on-surface shadow-[8px_8px_0px_0px_var(--border-color)] z-50 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b-4 border-brand-on-surface bg-brand-on-surface text-white">
              <h3 className="font-extrabold text-sm uppercase font-mono">SET_BUDGET_CAP</h3>
              <button onClick={() => setIsBudgetOpen(false)} className="p-1 text-white hover:text-rose-400 cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={budgetForm.handleSubmit(onBudgetSubmit)} className="p-6 space-y-4 font-sans">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Select Category</label>
                <select
                  {...budgetForm.register('category')}
                  className="w-full px-3 py-2 neo-input"
                >
                  <option value="all">All Outflows (Monthly Total)</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Cap Limit ({getCurrencySymbol()})</label>
                  <input
                    type="number"
                    {...budgetForm.register('limit')}
                    className="w-full px-3 py-2 neo-input"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Cycle</label>
                  <input
                    type="text"
                    placeholder="YYYY-MM"
                    {...budgetForm.register('month')}
                    className="w-full px-3 py-2 neo-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 border-2 border-brand-on-surface bg-brand-primary text-white font-black uppercase shadow-[4px_4px_0px_0px_var(--border-color)] pressed-state cursor-pointer"
              >
                Set Cap Limit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DEPOSIT FUNDS MODAL */}
      {depositGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setDepositGoalId(null)} />
          <div className="relative w-full max-w-sm bg-brand-surface-lowest border-4 border-brand-on-surface shadow-[8px_8px_0px_0px_var(--border-color)] z-50 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b-4 border-brand-on-surface bg-brand-on-surface text-white">
              <h3 className="font-extrabold text-sm uppercase font-mono">DEPOSIT_FUNDS</h3>
              <button onClick={() => setDepositGoalId(null)} className="p-1 text-white hover:text-rose-400 cursor-pointer">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono font-bold text-brand-outline">Deposit Amount ({getCurrencySymbol()})</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 neo-input"
                />
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {[10, 50, 100, 500, 1000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className="py-1 border-2 border-brand-on-surface bg-brand-surface-lowest hover:bg-brand-surface font-mono text-[9px] font-black shadow-[1px_1px_0px_0px_var(--border-color)] pressed-state cursor-pointer text-brand-on-surface"
                  >
                    +{getCurrencySymbol()}{amt}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleDepositFunds}
                className="w-full py-2.5 border-2 border-brand-on-surface bg-brand-primary text-white font-black uppercase shadow-[4px_4px_0px_0px_var(--border-color)] pressed-state flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PiggyBank className="w-4.5 h-4.5 text-brand-secondary-fixed" />
                <span>Confirm Deposit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;
