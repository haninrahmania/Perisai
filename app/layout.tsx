import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Literata } from 'next/font/google';
import { SessionProvider } from '@/components/SessionProvider';
import './globals.css';

const body = Inter({ subsets: ['latin'], variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
const display = Literata({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'Catatan',
  description: 'Catatan pribadi',
  icons: {
    icon: '/perisai_final.png',
    apple: '/perisai_final.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${body.variable} ${mono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}