import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CreditCard, PlusCircle, BarChart3, Target, Calendar, Sparkles, X, Info } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useSettingsStore } from '../../store/useSettingsStore';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddExpense: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onOpenAddExpense }) => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const { expenses, cards, goals } = useFinanceStore();
  const { formatCurrency } = useSettingsStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); 
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const defaultCommands = [
    { icon: <PlusCircle className="w-4.5 h-4.5 text-brand-primary" />, label: 'Create New Expense', action: () => { onOpenAddExpense(); onClose(); } },
    { icon: <BarChart3 className="w-4.5 h-4.5 text-brand-primary" />, label: 'Go to Analytics & Spending Trends', action: () => { navigate('/analytics'); onClose(); } },
    { icon: <CreditCard className="w-4.5 h-4.5 text-brand-primary" />, label: 'Manage Credit Cards', action: () => { navigate('/cards'); onClose(); } },
    { icon: <Target className="w-4.5 h-4.5 text-brand-primary" />, label: 'View Savings Goals & Budgets', action: () => { navigate('/goals'); onClose(); } },
    { icon: <Sparkles className="w-4.5 h-4.5 text-brand-primary animate-pulse" />, label: 'Consult LIQIFIN AI Assistant', action: () => { navigate('/ai-assistant'); onClose(); } },
    { icon: <Calendar className="w-4.5 h-4.5 text-brand-primary" />, label: 'Go to Dashboard Home', action: () => { navigate('/dashboard'); onClose(); } }
  ];

  const filteredCommands = defaultCommands.filter(c => 
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  const matchedExpenses = query.length >= 2 
    ? expenses.filter(e => e.title.toLowerCase().includes(query.toLowerCase()) || e.category.toLowerCase().includes(query.toLowerCase())).slice(0, 3)
    : [];

  const matchedCards = query.length >= 2
    ? cards.filter(c => c.cardName.toLowerCase().includes(query.toLowerCase()) || c.bank.toLowerCase().includes(query.toLowerCase())).slice(0, 2)
    : [];

  const matchedGoals = query.length >= 2
    ? goals.filter(g => g.title.toLowerCase().includes(query.toLowerCase())).slice(0, 2)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />

      {/* Palette Container */}
      <div className="relative w-full max-w-lg bg-brand-surface-lowest border-4 border-brand-on-surface shadow-[8px_8px_0px_0px_var(--border-color)] overflow-hidden flex flex-col z-50">
        
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 border-b-2 border-brand-on-surface py-3.5">
          <Search className="w-5 h-5 text-brand-on-surface shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="TYPE COMMANDS OR SEARCH LEDGER..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-0 text-brand-on-surface outline-none focus:outline-none focus:ring-0 placeholder-brand-outline text-xs font-mono font-bold"
          />
          <button onClick={onClose} className="p-1 hover:bg-brand-surface border border-transparent hover:border-brand-on-surface rounded-none cursor-pointer text-brand-on-surface">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[350px] overflow-y-auto p-2 space-y-3 font-sans">
          
          {/* Quick Commands */}
          <div>
            <p className="font-mono text-[9px] font-black uppercase tracking-wider text-brand-outline px-3 py-1.5">Commands</p>
            <div className="space-y-1">
              {filteredCommands.map((cmd, i) => (
                <button
                  key={i}
                  onClick={cmd.action}
                  className="w-full flex items-center gap-3 px-3 py-2 border-2 border-transparent hover:border-brand-on-surface hover:bg-brand-secondary-fixed transition-all text-left text-xs font-bold text-brand-on-surface cursor-pointer"
                >
                  {cmd.icon}
                  <span className="uppercase tracking-wide">{cmd.label}</span>
                </button>
              ))}
              {filteredCommands.length === 0 && (
                <p className="font-mono text-[10px] text-brand-outline px-3 py-2">NO COMMANDS MATCHED</p>
              )}
            </div>
          </div>

          {/* Matches across database */}
          {query.length >= 2 && (matchedExpenses.length > 0 || matchedCards.length > 0 || matchedGoals.length > 0) && (
            <div className="border-t-2 border-brand-on-surface pt-2">
              <p className="font-mono text-[9px] font-black uppercase tracking-wider text-brand-outline px-3 py-1.5">Database Ledger Matches</p>
              
              {/* Expenses matches */}
              {matchedExpenses.map(exp => (
                <button
                  key={exp.id || exp._id}
                  onClick={() => { navigate('/expenses'); onClose(); }}
                  className="w-full flex justify-between items-center px-3 py-2 border-2 border-transparent hover:border-brand-on-surface hover:bg-brand-secondary-fixed transition-all text-left text-xs font-bold text-brand-on-surface cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 border border-brand-on-surface bg-brand-primary" />
                    <span className="uppercase">{exp.title}</span>
                    <span className="font-mono text-[8px] text-brand-outline">({exp.category})</span>
                  </div>
                  <span className="font-mono font-black">-{formatCurrency(exp.amount)}</span>
                </button>
              ))}

              {/* Cards matches */}
              {matchedCards.map(card => (
                <button
                  key={card.id || card._id}
                  onClick={() => { navigate('/cards'); onClose(); }}
                  className="w-full flex justify-between items-center px-3 py-2 border-2 border-transparent hover:border-brand-on-surface hover:bg-brand-secondary-fixed transition-all text-left text-xs font-bold text-brand-on-surface cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 border border-brand-on-surface bg-brand-secondary-fixed" />
                    <span className="uppercase">{card.cardName}</span>
                    <span className="font-mono text-[8px] text-brand-outline">({card.bank})</span>
                  </div>
                  <span className="font-mono font-black">LIMIT: {formatCurrency(card.creditLimit, { precision: 0 })}</span>
                </button>
              ))}

              {/* Goals matches */}
              {matchedGoals.map(goal => (
                <button
                  key={goal.id || goal._id}
                  onClick={() => { navigate('/goals'); onClose(); }}
                  className="w-full flex justify-between items-center px-3 py-2 border-2 border-transparent hover:border-brand-on-surface hover:bg-brand-secondary-fixed transition-all text-left text-xs font-bold text-brand-on-surface cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 border border-brand-on-surface bg-emerald-400" />
                    <span className="uppercase">{goal.title}</span>
                  </div>
                  <span className="font-mono font-black">{((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)}%</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Palette Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t-2 border-brand-on-surface font-mono text-[9px] text-brand-outline font-bold">
          <div className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-brand-primary" />
            <span>USE <kbd className="bg-slate-200 border border-brand-on-surface px-1 text-[8px]">↑↓</kbd> TO NAVIGATE AND <kbd className="bg-slate-200 border border-brand-on-surface px-1 text-[8px]">ENTER</kbd></span>
          </div>
          <div>EXIT <kbd className="bg-slate-200 border border-brand-on-surface px-1 text-[8px]">ESC</kbd></div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
