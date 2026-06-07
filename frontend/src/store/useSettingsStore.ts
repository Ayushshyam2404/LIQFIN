import { create } from 'zustand';

export type CurrencyType = 'USD' | 'INR' | 'EUR' | 'GBP';

interface SettingsState {
  currency: CurrencyType;
  theme: 'light' | 'dark';
  setCurrency: (currency: CurrencyType) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  getCurrencySymbol: () => string;
  formatCurrency: (amount: number, options?: { showSign?: boolean; showSymbol?: boolean; precision?: number }) => string;
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  // Read initial values from localStorage
  const initialCurrency = (localStorage.getItem('liquid_currency') as CurrencyType) || 'USD';
  const initialTheme = (localStorage.getItem('liquid_theme') as 'light' | 'dark') || 'light';

  // Apply dark mode on initial load
  if (typeof window !== 'undefined') {
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  return {
    currency: initialCurrency,
    theme: initialTheme,
    setCurrency: (currency) => {
      localStorage.setItem('liquid_currency', currency);
      set({ currency });
    },
    setTheme: (theme) => {
      localStorage.setItem('liquid_theme', theme);
      if (typeof window !== 'undefined') {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      set({ theme });
    },
    getCurrencySymbol: () => {
      const { currency } = get();
      switch (currency) {
        case 'INR': return '₹';
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'USD':
        default: return '$';
      }
    },
    formatCurrency: (amount, options = {}) => {
      const { currency } = get();
      const showSign = options.showSign ?? true;
      const showSymbol = options.showSymbol ?? true;
      const precision = options.precision ?? 2;
      
      let symbol = '$';
      let locale = 'en-US';
      
      switch (currency) {
        case 'INR':
          symbol = '₹';
          locale = 'en-IN';
          break;
        case 'EUR':
          symbol = '€';
          locale = 'de-DE';
          break;
        case 'GBP':
          symbol = '£';
          locale = 'en-GB';
          break;
        case 'USD':
        default:
          symbol = '$';
          locale = 'en-US';
          break;
      }
      
      const formattedNumber = Math.abs(amount).toLocaleString(locale, {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      });

      const sign = showSign && amount < 0 ? '-' : '';
      const symbolStr = showSymbol ? symbol : '';
      
      return `${sign}${symbolStr}${formattedNumber}`;
    }
  };
});
