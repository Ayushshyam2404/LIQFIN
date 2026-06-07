import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  AlertTriangle
} from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import AppleCard3D from '../components/cards/AppleCard3D';

interface DashboardProps {
  onOpenAddExpense: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenAddExpense }) => {
  const navigate = useNavigate();
  const { user, registerPasskey } = useAuthStore();
  const { formatCurrency } = useSettingsStore();
  const { 
    dashboardStats, 
    fetchDashboard, 
    cards, 
    expenses, 
    goals
  } = useFinanceStore();

  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyEnrolled, setPasskeyEnrolled] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleEnrollPasskey = async () => {
    setPasskeyLoading(true);
    const success = await registerPasskey();
    setPasskeyLoading(false);
    if (success) {
      setPasskeyEnrolled(true);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Food': return <ShoppingBag className="w-5 h-5" />;
      case 'Groceries': return <ShoppingBag className="w-5 h-5" />;
      case 'Shopping': return <ShoppingBag className="w-5 h-5" />;
      default: return <ShoppingBag className="w-5 h-5" />;
    }
  };

  const getIconBg = (cat: string) => {
    switch (cat) {
      case 'Food': return 'bg-brand-primary-fixed';
      case 'Groceries': return 'bg-brand-secondary-fixed';
      case 'Shopping': return 'bg-brand-tertiary-fixed';
      default: return 'bg-brand-primary-fixed';
    }
  };

  const stats = dashboardStats || {
    totalBalance: 0,
    monthlyExpenses: 0,
    prevMonthlyExpenses: 0,
    monthlyIncome: 8500,
    netWorth: 0,
    savingsRate: 0,
    creditUtilization: 0,
    totalCreditBalance: 0,
    totalCreditLimit: 0
  };

  return (
    <div className="space-y-8">
      {/* Profile Check / Passkey banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-brand-on-surface uppercase tracking-tight font-mono">DASHBOARD_CORE</h2>
          <p className="text-xs text-brand-outline font-medium">Ledger account synchronization completed.</p>
        </div>

        {!passkeyEnrolled && user?.webAuthnCredentials?.length === 0 && (
          <div className="border-2 border-brand-on-surface px-4 py-2 flex items-center gap-3 bg-brand-surface-lowest neo-shadow-sm sticker-rotate-right">
            <ShieldCheck className="w-4 h-4 text-brand-primary" />
            <span className="text-[10px] text-brand-on-surface font-black uppercase font-mono">ENROLL BIOMETRIC FACE_ID</span>
            <button
              onClick={handleEnrollPasskey}
              disabled={passkeyLoading}
              className="px-2.5 py-1 bg-brand-primary text-white text-[9px] font-black uppercase border-2 border-brand-on-surface shadow-[2px_2px_0px_0px_var(--border-color)] pressed-state"
            >
              {passkeyLoading ? 'RUNNING...' : 'SECURE'}
            </button>
          </div>
        )}

        {passkeyEnrolled && (
          <div className="border-2 border-brand-on-surface px-4 py-2 flex items-center gap-2 bg-brand-secondary-fixed shadow-[2px_2px_0px_0px_var(--border-color)] font-mono text-[10px] font-black uppercase">
            <CheckCircle2 className="w-4 h-4" />
            <span>Passkey Security Activated</span>
          </div>
        )}
      </div>

      {/* HERO PORTFOLIO SECTION */}
      <section className="relative mt-4">
        <div className="absolute -top-3.5 -left-2 z-10">
          <div className="bg-brand-secondary-fixed border-2 border-brand-on-surface px-4 py-1 sticker-rotate-left font-mono text-[10px] font-black tracking-wide shadow-[2px_2px_0px_0px_var(--border-color)]">
            GLOBAL_PORTFOLIO_ASSETS
          </div>
        </div>

        <div className="bg-brand-surface-lowest border-4 border-brand-on-surface p-6 md:p-8 neo-shadow-blue relative overflow-hidden">
          {/* Abstract Grid background */}
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none">
            <div className="w-full h-full border-l-4 border-brand-on-surface grid grid-cols-4 grid-rows-4">
              <div className="border-b-4 border-r-4 border-brand-on-surface bg-brand-secondary"></div>
              <div className="border-b-4 border-r-4 border-brand-on-surface"></div>
              <div className="border-b-4 border-r-4 border-brand-on-surface"></div>
              <div className="border-b-4 border-brand-on-surface bg-brand-primary"></div>
            </div>
          </div>

          <p className="font-mono text-[10px] uppercase text-brand-outline font-bold tracking-wider mb-2">Total Net Worth</p>
          <h2 className="font-sans text-[32px] xs:text-[44px] sm:text-[56px] md:text-[80px] font-black leading-none tracking-tighter mb-4 text-brand-on-surface truncate">
            {formatCurrency(stats.netWorth)}
          </h2>

          <div className="flex flex-wrap gap-3">
            <div className="bg-brand-secondary-fixed px-3 py-1.5 border-2 border-brand-on-surface font-mono text-[10px] font-black flex items-center gap-1.5 shadow-[2px_2px_0px_0px_var(--border-color)]">
              <TrendingUp className="w-4 h-4" />
              <span>SAVINGS RATE: {stats.savingsRate.toFixed(1)}%</span>
            </div>
            <div className="bg-brand-primary-fixed px-3 py-1.5 border-2 border-brand-on-surface font-mono text-[10px] font-black flex items-center gap-1.5 shadow-[2px_2px_0px_0px_var(--border-color)]">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              <span>ACTIVE GOALS: {goals.length}</span>
            </div>
          </div>
        </div>
      </section>

      {/* CORE GRID: Active Lines & Log Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: ACTIVE LINES / CREDIT CARDS */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-lg font-black uppercase tracking-tight">Active_Lines</h3>
            <span 
              onClick={() => navigate('/cards')}
              className="font-mono text-[10px] text-brand-outline underline cursor-pointer font-bold hover:text-brand-on-surface"
            >
              MANAGE_CARDS
            </span>
          </div>

          {/* Overlapping/Offset Cards Area */}
          <div className="border-4 border-brand-on-surface bg-brand-surface-lowest p-6 neo-shadow-md min-h-[300px] flex flex-col justify-center">
            {cards.length > 0 ? (
              <div className="flex flex-wrap gap-6 justify-center">
                {cards.slice(0, 2).map((card, idx) => (
                  <div 
                    key={card.id || card._id} 
                    className={`transform transition-all ${
                      idx === 1 ? 'sticker-rotate-right hover:rotate-0' : 'sticker-rotate-left hover:rotate-0'
                    }`}
                  >
                    <AppleCard3D
                      cardName={card.cardName}
                      bank={card.bank}
                      creditLimit={card.creditLimit}
                      currentBalance={card.currentBalance}
                      dueDate={card.dueDate}
                      colorTheme={card.colorTheme}
                      cardNumberLastFour={card.cardNumberLastFour}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center space-y-3 flex flex-col items-center">
                <CreditCard className="w-8 h-8 text-brand-outline" />
                <p className="font-mono text-xs font-bold text-brand-outline">NO ACTIVE CREDIT LINES FOUND</p>
                <button
                  onClick={() => navigate('/cards')}
                  className="px-4 py-2 border-2 border-brand-on-surface font-mono text-[10px] font-black uppercase bg-brand-secondary-fixed shadow-[2px_2px_0px_0px_var(--border-color)] pressed-state"
                >
                  Configure Card
                </button>
              </div>
            )}
          </div>

          {/* Secondary card stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-brand-surface-lowest border-2 border-brand-on-surface p-4 shadow-[2px_2px_0px_0px_var(--border-color)]">
              <p className="font-mono text-[9px] text-brand-outline uppercase mb-1 font-bold">Credit Utilization</p>
              <div className="h-4 w-full bg-brand-surface border-2 border-brand-on-surface mb-2 overflow-hidden">
                <div 
                  className="h-full bg-brand-primary-container" 
                  style={{ width: `${Math.min(100, stats.creditUtilization)}%` }} 
                />
              </div>
              <p className="font-mono text-base font-black leading-none">{formatCurrency(stats.totalCreditBalance ?? 0, { precision: 0 })} / {formatCurrency(stats.totalCreditLimit ?? 0, { precision: 0 })}</p>
            </div>
            
            <div className="bg-brand-surface-lowest border-2 border-brand-on-surface p-4 shadow-[2px_2px_0px_0px_var(--border-color)]">
              <p className="font-mono text-[9px] text-brand-outline uppercase mb-1.5 font-bold">Credit Health Score</p>
              <p className="font-mono text-base font-black text-brand-secondary leading-none">812</p>
              <p className="text-[8px] font-mono text-brand-outline font-bold pt-1 uppercase">EXCELLENT RATING</p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: LOG STREAM / TRANSACTIONS */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="font-sans text-lg font-black uppercase tracking-tight">Log_Stream</h3>
          
          <div className="border-4 border-brand-on-surface bg-brand-surface-lowest neo-shadow-md overflow-hidden flex flex-col justify-between">
            {/* Header row */}
            <div className="p-3 bg-brand-on-surface text-white font-mono flex justify-between items-center text-[9px] font-black tracking-wider">
              <span>LEDGER_ID</span>
              <span>TIMESTAMP</span>
              <span>OUTFLOW</span>
            </div>

            {/* List */}
            <div className="divide-y-2 divide-brand-on-surface">
              {expenses.slice(0, 4).map((exp) => (
                <div 
                  key={exp.id || exp._id} 
                  className="p-4 flex items-center justify-between hover:bg-brand-secondary-fixed transition-colors cursor-crosshair group bg-brand-surface-lowest"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 border-2 border-brand-on-surface ${getIconBg(exp.category)} group-hover:bg-brand-surface transition-colors`}>
                      {getCategoryIcon(exp.category)}
                    </div>
                    <div>
                      <p className="font-bold text-xs uppercase text-brand-on-surface truncate max-w-[120px]">{exp.title}</p>
                      <p className="font-mono text-[9px] text-brand-outline font-bold uppercase">{exp.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs font-black text-brand-on-surface">-{formatCurrency(exp.amount)}</p>
                    <p className="font-mono text-[8px] text-brand-outline font-bold">
                      {new Date(exp.date).toLocaleDateString([], { month: '2-digit', day: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {expenses.length === 0 && (
                <div className="py-16 text-center space-y-2">
                  <p className="font-mono text-xs text-brand-outline font-black">NO TRANSACTION RECORDS FOUND</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => navigate('/expenses')}
              className="w-full py-3 border-t-2 border-brand-on-surface font-mono text-[10px] font-black uppercase bg-brand-surface-lowest hover:bg-brand-surface transition-all cursor-pointer text-brand-on-surface"
            >
              VIEW_FULL_TRANSACTION_LOG
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM WIDGET GRID */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick swap links */}
        <div className="border-2 border-brand-on-surface p-4 bg-brand-surface-lowest shadow-[4px_4px_0px_0px_var(--border-color)] flex flex-col justify-between">
          <div className="mb-4">
            <span className="font-mono text-[8px] bg-brand-on-surface text-white px-2 py-0.5 sticker-rotate-left inline-block mb-1.5 font-bold">QUICK_ACTION</span>
            <h4 className="font-sans text-xs font-black uppercase text-brand-on-surface">Trigger Action</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={onOpenAddExpense}
              className="border-2 border-brand-on-surface p-2 font-mono text-[9px] font-black bg-brand-secondary-fixed hover:bg-brand-secondary-fixed-dim transition-all shadow-[2px_2px_0px_0px_var(--border-color)] pressed-state"
            >
              ADD_EXPENSE
            </button>
            <button 
              onClick={() => navigate('/ai-assistant')}
              className="border-2 border-brand-on-surface p-2 font-mono text-[9px] font-black bg-brand-surface-lowest hover:bg-brand-surface transition-all shadow-[2px_2px_0px_0px_var(--border-color)] pressed-state"
            >
              CONSULT_AI
            </button>
          </div>
        </div>

        {/* Alert box */}
        <div className="border-2 border-brand-on-surface bg-brand-on-surface p-4 shadow-[4px_4px_0px_0px_var(--border-color)] flex flex-col justify-between text-white">
          <div className="mb-4">
            <h4 className="font-sans text-xs font-black uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-brand-secondary-fixed" />
              <span>MARKET_ALERT</span>
            </h4>
            <p className="font-mono text-[10px] opacity-80 mt-1 uppercase">VIX VOLATILITY COEFFICIENT HIGH (+8%)</p>
          </div>
          <button 
            onClick={() => alert('Volatility protection triggers locked.')}
            className="w-full bg-brand-surface-lowest text-brand-on-surface border-2 border-brand-surface-lowest py-1.5 font-black uppercase text-[10px] hover:bg-transparent hover:text-white transition-all pressed-state"
          >
            ENABLE_PROTECTION
          </button>
        </div>

        {/* Email Alert forwarder info */}
        <div className="border-2 border-brand-on-surface p-4 bg-brand-primary-fixed shadow-[4px_4px_0px_0px_var(--border-color)] relative overflow-hidden flex flex-col justify-between">
          <div className="mb-4">
            <h4 className="font-sans text-xs font-black uppercase">EMAIL_FORWARDER</h4>
            <p className="font-mono text-[9px] font-bold text-brand-primary-fixed-variant mt-1.5 uppercase">
              Forward Axis Bank card spend alerts to:
            </p>
            <p className="font-mono text-[8px] font-black text-brand-on-surface mt-1.5 break-all bg-brand-surface-lowest border border-brand-on-surface p-1.5">
              /api/expenses/email-webhook
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse border border-brand-on-surface"></div>
            <span className="font-mono text-[8px] font-black uppercase">AI ALERT PARSER RUNNING</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
