import React from 'react';
import { Bell, Check, Trash2, X, AlertTriangle, Sparkles, CheckCircle2, Info } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead, markAllNotificationsRead, clearNotifications } = useFinanceStore();

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />;
      case 'danger':
        return <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-transparent" onClick={onClose} />
      
      {/* Panel */}
      <div className="absolute right-0 top-14 w-[300px] sm:w-[360px] bg-brand-surface-lowest border-4 border-brand-on-surface shadow-[4px_4px_0px_0px_var(--border-color)] z-50 p-4 flex flex-col max-h-[450px] overflow-hidden animate-float">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b-2 border-brand-on-surface mb-3">
          <div className="flex items-center gap-1.5 font-mono">
            <Bell className="w-4.5 h-4.5 text-brand-primary" />
            <h3 className="font-black text-xs uppercase text-brand-on-surface">Inbox</h3>
            {unreadCount > 0 && (
              <span className="text-[8px] px-1.5 py-0.5 border border-brand-on-surface bg-rose-500 font-black text-white ml-1.5 shadow-[1px_1px_0px_0px_var(--border-color)]">
                {unreadCount} NEW
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllNotificationsRead()}
                title="Mark all read"
                className="p-1 border-2 border-brand-on-surface bg-brand-surface-lowest hover:bg-brand-surface transition-all cursor-pointer shadow-[1px_1px_0px_0px_var(--border-color)] pressed-state text-brand-on-surface"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => clearNotifications()}
                title="Clear all"
                className="p-1 border-2 border-brand-on-surface bg-rose-500 text-white hover:bg-rose-600 transition-all cursor-pointer shadow-[1px_1px_0px_0px_var(--border-color)] pressed-state"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 border-2 border-brand-on-surface bg-brand-surface-lowest hover:bg-brand-surface transition-all cursor-pointer shadow-[1px_1px_0px_0px_var(--border-color)] pressed-state text-brand-on-surface"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 font-sans">
          {notifications.map((n) => (
            <div
              key={n.id || n._id}
              onClick={() => {
                if (!n.read && (n.id || n._id)) {
                  markNotificationRead((n.id || n._id) as string);
                }
              }}
              className={`p-3 border-2 transition-all cursor-pointer ${
                n.read 
                  ? 'bg-brand-surface border-brand-outline/30 opacity-60' 
                  : 'bg-brand-surface-lowest border-brand-on-surface hover:bg-brand-secondary-fixed shadow-[2px_2px_0px_0px_var(--border-color)]'
              }`}
            >
              <div className="flex gap-2.5">
                {getTypeIcon(n.type)}
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-tight text-brand-on-surface leading-tight">{n.title}</h4>
                  <p className="text-[10px] text-brand-outline leading-normal font-medium">{n.message}</p>
                  <span className="text-[8px] text-brand-outline font-mono block pt-0.5 font-bold">
                    {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase()} —{' '}
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="py-12 text-center space-y-2 font-mono">
              <Sparkles className="w-8 h-8 text-brand-outline mx-auto" />
              <p className="text-xs text-brand-outline font-bold">NO EVENT INBOX LOGS</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
