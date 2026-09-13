import React from 'react';
import { cn } from '../../utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn("animate-pulse bg-slate-200/80 rounded-md", className)}
      aria-hidden="true"
      {...props}
    />
  );
};

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
  lineClassName?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className,
  lineClassName
}) => {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-3.5",
            i === lines - 1 && lines > 1 ? "w-3/5" : i % 2 === 0 ? "w-full" : "w-4/5",
            lineClassName
          )}
        />
      ))}
    </div>
  );
};

export interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className }) => {
  return (
    <div className={cn("p-5 bg-white border border-slate-200 rounded-lg space-y-4", className)} aria-hidden="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
    </div>
  );
};

export interface SkeletonRowProps {
  className?: string;
}

export const SkeletonRow: React.FC<SkeletonRowProps> = ({ className }) => {
  return (
    <div className={cn("p-3.5 flex items-center justify-between gap-4 border-b border-slate-100 bg-white", className)} aria-hidden="true">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-md" />
      </div>
    </div>
  );
};

export interface SkeletonEditorProps {
  className?: string;
}

export const SkeletonEditor: React.FC<SkeletonEditorProps> = ({ className }) => {
  return (
    <div className={cn("flex min-h-[calc(100vh-4rem)] flex-col bg-white", className)} aria-hidden="true">
      {/* Top Header */}
      <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-20 rounded-md" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      {/* 3 Pane Body */}
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)_330px]">
        {/* Left Rail */}
        <div className="border-r border-slate-200 bg-slate-50/60 p-3 space-y-2 hidden lg:block">
          <div className="flex items-center justify-between px-2 mb-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-8" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md" />
          ))}
        </div>

        {/* Center Writing Area */}
        <div className="p-6 space-y-5">
          <div className="border-b border-slate-200 pb-3 flex items-end justify-between">
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-3 w-72" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-80 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>

        {/* Right Inspector */}
        <div className="border-l border-slate-200 bg-slate-50/60 p-4 space-y-4 hidden lg:block">
          <div className="flex gap-2 border-b border-slate-200 pb-2">
            <Skeleton className="h-7 w-20 rounded-md" />
            <Skeleton className="h-7 w-20 rounded-md" />
            <Skeleton className="h-7 w-20 rounded-md" />
          </div>
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonParagraph: React.FC<{ lines?: number; className?: string }> = ({
  lines = 4,
  className
}) => {
  return (
    <div className={cn("space-y-2.5", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-2/3" : "w-full"
          )}
        />
      ))}
    </div>
  );
};
