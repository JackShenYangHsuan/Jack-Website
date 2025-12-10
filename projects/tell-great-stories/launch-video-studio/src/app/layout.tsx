import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout';
import { ToastProvider } from '@/components/ui';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Launch Video Studio',
  description: 'Create cinematic AI-generated launch videos for your startup',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body
        style={{
          fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif',
          margin: 0,
          padding: 0,
          minHeight: '100vh',
          background: '#fafafa',
        }}
      >
        <ToastProvider>
          {/* Fixed Sidebar */}
          <Sidebar />

          {/* Main content - positioned after sidebar */}
          <div
            style={{
              marginLeft: '220px',
              minHeight: '100vh',
              background: '#ffffff',
            }}
          >
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
