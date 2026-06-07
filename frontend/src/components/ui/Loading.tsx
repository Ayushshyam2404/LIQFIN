import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div 
      className={`bg-brand-on-surface/10 animate-pulse border border-brand-on-surface/5 ${className}`}
      aria-hidden="true"
    />
  );
};

export const TableSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-4 animate-fade-in" aria-busy="true">
      <div className="flex justify-between items-center py-2">
        <Skeleton className="h-6 w-1/4 rounded" />
        <Skeleton className="h-10 w-32 rounded" />
      </div>
      <div className="border-4 border-brand-on-surface p-4 space-y-4 bg-brand-surface-lowest neo-shadow-sm">
        <div className="flex gap-4 border-b-2 border-brand-on-surface pb-3">
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-4 flex-1 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 items-center py-2">
            <Skeleton className="h-5 w-5 rounded-md" />
            <Skeleton className="h-4 flex-1 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="border-4 border-brand-on-surface p-6 bg-brand-surface-lowest neo-shadow-sm space-y-4 animate-fade-in" aria-busy="true">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3 rounded" />
          <Skeleton className="h-6 w-1/2 rounded" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full rounded" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-4 w-1/4 rounded" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  );
};
