import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'ForgeOps',
    template: '%s · ForgeOps',
  },
  description: 'The internal developer platform with an AI copilot built in.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${geistMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
