import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { ToastProvider } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'Studio Operator | AI Creative Agency OS',
  description: 'Internal operating system and human-governed pipeline for a one-person AI creative agency.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased selection:bg-zinc-800 selection:text-amber-300">
        <ToastProvider>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
