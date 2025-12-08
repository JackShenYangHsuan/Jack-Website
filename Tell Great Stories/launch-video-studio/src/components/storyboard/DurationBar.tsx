'use client';

import { cn } from '@/lib/utils';

export interface DurationBarProps {
  current: number;
  target: number;
  className?: string;
}

export function DurationBar({ current, target, className }: DurationBarProps) {
  const percentage = Math.min((current / target) * 100, 120);
  const isOver = current > target;
  const isUnder = current < target * 0.8;
  const isGood = !isOver && !isUnder;

  return (
    <div className={cn('h-2 bg-zinc-100 rounded-full overflow-hidden', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all duration-300',
          isGood && 'bg-green-500',
          isUnder && 'bg-amber-500',
          isOver && 'bg-red-500'
        )}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );
}
