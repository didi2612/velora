import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import AppLayout from '@/components/AppLayout';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Velora — Cashier System',
  description: 'Modern cashier management system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <AppLayout>{children}</AppLayout>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1E293B', color: '#F1F5F9', border: '1px solid #334155', borderRadius: '10px', fontSize: '14px' },
            success: { iconTheme: { primary: '#10B981', secondary: '#1E293B' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#1E293B' } },
          }}
        />
      </body>
    </html>
  );
}
