import { cn } from '@/lib/utils';

/**
 * Global loading state
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div
          className={cn(
            'w-8 h-8 rounded-full border-2',
            'border-[#eaeaea] border-t-[#111111]',
            'animate-spin'
          )}
        />
        <p className="text-sm text-[#888888]">Loading...</p>
      </div>
    </div>
  );
}
