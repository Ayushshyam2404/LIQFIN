import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Copy, 
  Edit3, 
  Plus, 
  ArrowUpDown, 
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { TableSkeleton } from '../components/ui/Loading';
import { EmptyState } from '../components/ui/EmptyState';

interface ExpensesPageProps {
  onOpenAddExpense: () => void;
  onEditExpense: (id: string) => void;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({ onOpenAddExpense, onEditExpense }) => {
  const { expenses, fetchExpenses, deleteExpense, deleteExpensesBulk, duplicateExpense, isLoading } = useFinanceStore();
  const { formatCurrency } = useSettingsStore();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetchExpenses({ search, category, paymentMethod });
  }, [search, category, paymentMethod]);

  const categories = [
    'Food', 'Groceries', 'Travel', 'Transportation', 'Entertainment', 
    'Shopping', 'Utilities', 'Bills', 'Rent', 'Salary', 'Freelance', 
    'Investments', 'Miscellaneous'
  ];

  const sortedExpenses = [...expenses].sort((a, b) => {
    const fieldA = sortField === 'date' ? new Date(a.date).getTime() : a.amount;
    const fieldB = sortField === 'date' ? new Date(b.date).getTime() : b.amount;
    
    if (sortOrder === 'asc') return fieldA > fieldB ? 1 : -1;
    return fieldA < fieldB ? 1 : -1;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = sortedExpenses.map(exp => (exp.id || exp._id) as string).filter(Boolean);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} transactions?`)) {
      await deleteExpensesBulk(selectedIds);
      setSelectedIds([]);
    }
  };

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const exportToCSV = () => {
    const headers = 'Merchant,Amount,Category,PaymentMethod,Date\n';
    const rows = sortedExpenses.map(e => 
      `"${e.title.replace(/"/g, '""')}",${e.amount},"${e.category}","${e.paymentMethod}","${new Date(e.date).toLocaleDateString()}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `LIQIFIN_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-brand-on-surface uppercase tracking-tight font-mono">FINANCE_LEDGER</h2>
          <p className="text-xs text-brand-outline font-medium">Search, filter, and audit transaction records.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            title="Export CSV"
            className="p-2.5 border-2 border-brand-on-surface neo-shadow-sm bg-brand-surface-lowest hover:bg-brand-surface transition-all cursor-pointer text-brand-on-surface"
          >
            <FileSpreadsheet className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-brand-on-surface font-mono text-xs font-black uppercase bg-brand-primary text-white shadow-[4px_4px_0px_0px_var(--border-color)] pressed-state cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Outflow</span>
          </button>
        </div>
      </div>

      {/* Filter Drawer Card */}
      <div className="border-4 border-brand-on-surface bg-brand-surface-lowest p-4 space-y-4 neo-shadow-md">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-brand-surface-lowest border-2 border-brand-on-surface px-3 py-2.5">
            <Search className="w-4.5 h-4.5 text-brand-outline" />
            <input
              type="text"
              placeholder="SEARCH BY MERCHANT OR CATEGORY..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none outline-none font-mono text-[11px] focus:ring-0 text-brand-on-surface"
            />
          </div>

          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`px-4 py-2.5 border-2 border-brand-on-surface font-mono text-xs font-black uppercase transition-all cursor-pointer shadow-[2px_2px_0px_0px_var(--border-color)] pressed-state ${
              isFilterOpen ? 'bg-brand-secondary-fixed' : 'bg-brand-surface-lowest'
            }`}
          >
            <Filter className="w-4 h-4 inline mr-1" />
            <span>Filters</span>
          </button>
        </div>

        {isFilterOpen && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t-2 border-brand-on-surface sticker-rotate-right bg-brand-surface/50 p-3">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold font-mono text-brand-outline">Select Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border-2 border-brand-on-surface bg-brand-surface-lowest text-xs font-mono text-brand-on-surface"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold font-mono text-brand-outline">Select Channel</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border-2 border-brand-on-surface bg-brand-surface-lowest text-xs font-mono text-brand-on-surface"
              >
                <option value="">All Channels</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI / QR Code</option>
                <option value="debit_card">Debit Card</option>
                <option value="credit_card">Credit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            <div className="flex items-end justify-end">
              <button
                onClick={() => { setCategory(''); setPaymentMethod(''); }}
                className="px-4 py-2 border-2 border-brand-on-surface font-mono text-[10px] font-black uppercase bg-brand-surface-lowest hover:bg-brand-surface transition-all shadow-[2px_2px_0px_0px_var(--border-color)] pressed-state cursor-pointer text-brand-on-surface"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-brand-primary-fixed border-2 border-brand-on-surface px-4 py-3 flex justify-between items-center shadow-[4px_4px_0px_0px_var(--border-color)] sticker-rotate-left">
          <span className="text-xs font-black uppercase font-mono text-brand-on-surface">{selectedIds.length} ITEMS_SELECTED</span>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 border-2 border-brand-on-surface text-white text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_var(--border-color)] pressed-state cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Selected</span>
          </button>
        </div>
      )}

      {/* Conditional rendering for Loading and Empty States */}
      {isLoading ? (
        <TableSkeleton />
      ) : sortedExpenses.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="NO LEDGER POSTINGS LOCATED"
          description="We couldn't find any transactions matching your parameters. Adjust your filters or log a new transaction outflows."
          actionText="Log Outflow"
          onActionClick={onOpenAddExpense}
        />
      ) : (
        /* Main Table Ledger */
        <div className="border-4 border-brand-on-surface bg-brand-surface-lowest neo-shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-brand-on-surface text-white border-b-4 border-brand-on-surface font-mono text-[9px] font-black tracking-wider uppercase">
                <tr>
                  <th className="px-4 py-3 text-center w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedIds.length === sortedExpenses.length && sortedExpenses.length > 0}
                      className="w-4 h-4 border-2 border-brand-on-surface rounded-none accent-brand-primary"
                    />
                  </th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort('date')}>
                    <div className="flex items-center gap-1">
                      <span>Date</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="px-4 py-3">Merchant / Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Payment Channel</th>
                  <th className="px-4 py-3 text-right cursor-pointer" onClick={() => toggleSort('amount')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>Value</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-brand-on-surface text-brand-on-surface font-bold">
                {sortedExpenses.map((exp) => {
                  const expId = (exp.id || exp._id) as string;
                  const isSelected = selectedIds.includes(expId);
                  return (
                    <tr 
                      key={expId} 
                      className={`hover:bg-brand-surface transition-colors ${
                        isSelected ? 'bg-brand-secondary-fixed/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(expId)}
                          className="w-4 h-4 border-2 border-brand-on-surface rounded-none accent-brand-primary"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-brand-outline">
                        {new Date(exp.date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm">{exp.title}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-brand-surface border border-brand-on-surface/20 text-[10px] font-black uppercase tracking-wider font-mono">
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-black uppercase font-mono text-brand-outline">
                          {exp.paymentMethod.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => onEditExpense(expId)}
                            className="p-1 border-2 border-brand-on-surface hover:bg-brand-secondary-fixed transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Duplicate this transaction?')) {
                                await duplicateExpense(expId);
                              }
                            }}
                            className="p-1 border-2 border-brand-on-surface hover:bg-brand-primary-fixed transition-all cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Delete this ledger posting?')) {
                                await deleteExpense(expId);
                              }
                            }}
                            className="p-1 border-2 border-brand-on-surface hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
