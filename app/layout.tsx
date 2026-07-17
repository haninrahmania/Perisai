import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Literata } from 'next/font/google';
import { OfflineBootstrap } from '@/components/OfflineBootstrap';
import './globals.css';

const body = Inter({ subsets: ['latin'], variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
const display = Literata({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'Perisai',
  description: 'Simpan bukti dan susun laporan dengan kendali tetap di tanganmu',
  icons: {
    icon: '/perisai_final.png',
    apple: '/perisai_final.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${body.variable} ${mono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <OfflineBootstrap />
        {children}
      </body>
    </html>
  );
}
