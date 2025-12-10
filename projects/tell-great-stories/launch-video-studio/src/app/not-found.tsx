import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Custom 404 page
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-bold text-[#111111] mb-4">404</h1>
        <h2 className="text-xl font-semibold text-[#111111] mb-2">Page Not Found</h2>
        <p className="text-[#666666] mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Link
          href="/projects"
          className={cn(
            'inline-flex items-center justify-center px-4 py-2 rounded-md',
            'bg-[#111111] text-[#ffffff] font-medium',
            'hover:bg-[#333333] transition-colors'
          )}
        >
          Go to Projects
        </Link>
      </div>
    </div>
  );
}
