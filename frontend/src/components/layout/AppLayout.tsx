import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  CreditCard, 
  Target, 
  BarChart3, 
  Sparkles, 
  Bell, 
  LogOut, 
  WifiOff, 
  Search, 
  Plus,
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import CommandPalette from '../ui/CommandPalette';
import NotificationPanel from '../ui/NotificationPanel';

interface AppLayoutProps {
  children: React.ReactNode;
  onOpenAddExpense: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, onOpenAddExpense }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { isOffline, notifications, fetchNotifications } = useFinanceStore();
  const { theme, setTheme } = useSettingsStore();

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', path: '/dashboard' },
    { icon: <Receipt className="w-5 h-5" />, label: 'Expenses', path: '/expenses' },
    { icon: <CreditCard className="w-5 h-5" />, label: 'Credit Cards', path: '/cards' },
    { icon: <Target className="w-5 h-5" />, label: 'Budgets & Goals', path: '/goals' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Analytics', path: '/analytics' },
    { icon: <Sparkles className="w-5 h-5" />, label: 'AI Assistant', path: '/ai-assistant' },
    { icon: <Settings className="w-5 h-5" />, label: 'Settings', path: '/settings' }
  ];

  const handleNav = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative z-10 font-sans bg-brand-surface selection:bg-brand-secondary-fixed">
      {/* COMMAND PALETTE & NOTIFICATION CENTER */}
      <CommandPalette 
        isOpen={isCommandOpen} 
        onClose={() => setIsCommandOpen(false)}
        onOpenAddExpense={onOpenAddExpense}
      />

      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col h-screen w-64 border-r-4 border-brand-on-surface bg-brand-surface-lowest py-6 shrink-0 sticky top-0">
        {/* App Title Logo */}
        <div className="px-6 mb-10">
          <h1 className="font-sans text-[32px] font-black tracking-tighter text-brand-on-surface leading-none">LIQIFIN</h1>
          <p className="font-mono text-[10px] text-brand-outline uppercase tracking-wider">FINANCE_V1.0</p>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-grow space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 my-1.5 transition-all text-left uppercase text-xs font-black cursor-pointer ${
                  isActive 
                    ? 'bg-brand-secondary-fixed text-brand-on-surface border-2 border-brand-on-surface shadow-[4px_4px_0px_0px_var(--border-color)] pressed-state' 
                    : 'text-brand-on-surface hover:bg-brand-surface hover:translate-x-1 border-2 border-transparent'
                }`}
              >
                {item.icon}
                <span className="tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Action */}
        <div className="px-6 mt-auto space-y-6">
          {isOffline && (
            <div className="flex items-center gap-2 text-brand-on-surface bg-amber-400 border-2 border-brand-on-surface px-3 py-2 text-xs font-extrabold neo-shadow-sm sticker-rotate-left">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>OFFLINE_CACHE</span>
            </div>
          )}

          <button 
            onClick={onOpenAddExpense}
            className="w-full bg-brand-primary text-white font-black uppercase py-3.5 border-2 border-brand-on-surface neo-shadow-md hover:neo-shadow-sm active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
          >
            NEW TRANSACTION
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="flex justify-between items-center w-full px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-40 bg-brand-surface-lowest border-b-4 border-brand-on-surface">
          <div className="flex-1 max-w-lg min-w-0 mr-2 sm:mr-0">
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-brand-on-surface">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="SEARCH..."
                onClick={() => setIsCommandOpen(true)}
                readOnly
                className="w-full bg-brand-surface-lowest border-2 border-brand-on-surface pl-12 pr-4 py-2 font-mono text-[11px] focus:ring-4 focus:ring-brand-primary-container outline-none neo-shadow-sm cursor-pointer"
              />
              <div className="hidden md:block absolute -top-3 -right-2 bg-brand-secondary-fixed px-2 border-2 border-brand-on-surface sticker-rotate-right font-mono text-[9px] font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                CMD + K
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 ml-2 sm:ml-6 shrink-0">
            {/* Notifications panel anchor */}
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2.5 border-2 border-brand-on-surface neo-shadow-sm bg-brand-surface-lowest hover:bg-brand-surface transition-all cursor-pointer relative"
              >
                <Bell className="w-4.5 h-4.5 text-brand-on-surface" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 border-2 border-brand-on-surface text-[8px] font-black text-white px-1.5 rounded-full shadow-[1px_1px_0px_0px_var(--border-color)]">
                    {unreadNotifCount}
                  </span>
                )}
              </button>
              <NotificationPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
            </div>

            {/* Dark Mode toggle button */}
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2.5 border-2 border-brand-on-surface neo-shadow-sm bg-brand-surface-lowest hover:bg-brand-surface text-brand-on-surface transition-all cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-amber-500 fill-amber-500" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            <button 
              onClick={() => logout()}
              title="Logout"
              className="p-2.5 border-2 border-brand-on-surface neo-shadow-sm bg-brand-surface-lowest hover:bg-brand-surface text-brand-on-surface hover:text-rose-600 transition-all cursor-pointer"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>

            {/* Profile badge */}
            <div 
              onClick={() => navigate('/profile')}
              title="View Profile"
              className="hidden sm:flex items-center gap-2 border-2 border-brand-on-surface px-3 py-1.5 neo-shadow-sm bg-brand-surface-lowest hover:bg-brand-surface cursor-pointer"
            >
              <div className="w-6.5 h-6.5 rounded-full border-2 border-brand-on-surface bg-brand-primary-fixed overflow-hidden">
                <img 
                  src={user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user?.name || 'Julian')}`} 
                  alt="User avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-mono font-bold text-[10px] uppercase truncate max-w-[80px]">{user?.name.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Mobile Header indicator if offline */}
        {isOffline && (
          <div className="md:hidden flex items-center justify-center gap-2 py-1.5 bg-amber-400 border-b-2 border-brand-on-surface text-[10px] font-black uppercase text-brand-on-surface">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Running Offline Mode</span>
          </div>
        )}

        {/* Page rendering slot */}
        <div className="p-6 pb-36 md:pb-6 overflow-y-auto flex-1">
          {children}
        </div>
      </main>

      {/* Floating Action Button (FAB) for mobile quick create */}
      <button
        onClick={onOpenAddExpense}
        className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-brand-primary text-white border-4 border-brand-on-surface neo-shadow-md flex items-center justify-center z-40 pressed-state-lg"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Mobile Bottom Navigation Bar (Neo-brutalist style) */}
      <div className="md:hidden fixed bottom-4 inset-x-4 h-16 z-30">
        <div className="h-full rounded-xl bg-brand-surface-lowest border-4 border-brand-on-surface flex justify-around items-center px-2 shadow-[4px_4px_0px_0px_var(--border-color)]">
          {menuItems.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-all ${
                  isActive 
                    ? 'text-brand-on-surface bg-brand-secondary-fixed border-2 border-brand-on-surface shadow-[2px_2px_0px_0px_var(--border-color)] font-bold' 
                    : 'text-brand-outline'
                }`}
              >
                {item.icon}
                <span className="text-[7px] mt-0.5 font-bold uppercase">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
          
          <button
            onClick={() => handleNav('/ai-assistant')}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-all ${
              location.pathname === '/ai-assistant' 
                ? 'text-brand-on-surface bg-brand-secondary-fixed border-2 border-brand-on-surface shadow-[2px_2px_0px_0px_var(--border-color)] font-bold' 
                : 'text-brand-outline'
            }`}
          >
            <Sparkles className="w-5 h-5 text-brand-primary" />
            <span className="text-[7px] mt-0.5 font-bold uppercase">AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
