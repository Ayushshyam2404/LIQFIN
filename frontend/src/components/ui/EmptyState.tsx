import React from 'react';
import { LucideIcon, Info } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onActionClick?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Info,
  title,
  description,
  actionText,
  onActionClick,
  className = ''
}) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center text-center p-8 border-4 border-brand-on-surface bg-brand-surface-lowest neo-shadow-sm space-y-4 max-w-lg mx-auto ${className}`}
      role="status"
    >
      <div className="p-4 bg-brand-secondary-fixed border-2 border-brand-on-surface rounded-xl shadow-[3px_3px_0px_0px_var(--border-color)] sticker-rotate-left">
        <Icon className="w-8 h-8 text-brand-on-surface" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h3 className="font-mono text-xs font-black uppercase tracking-wider text-brand-on-surface">{title}</h3>
        <p className="text-sm text-brand-outline font-medium max-w-sm">{description}</p>
      </div>
      {actionText && onActionClick && (
        <button
          onClick={onActionClick}
          aria-label={actionText}
          className="px-4 py-2 border-2 border-brand-on-surface font-mono text-xs font-black uppercase bg-brand-primary text-white shadow-[3px_3px_0px_0px_var(--border-color)] pressed-state cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
