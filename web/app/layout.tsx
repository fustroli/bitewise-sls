import './globals.css';

import { Manrope } from 'next/font/google';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/app/providers/theme-provider';
import { Toaster } from '@/app/components/ui/toaster';

// Self-hosted by Next at build time (so `font-src 'self'` holds), preloaded,
// with a size-adjusted fallback.
const manrope = Manrope({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: 'BiteWise - The Meal Planner',
  description:
    'BiteWise is a meal planner that helps you plan your meals and track your nutrition.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // next-themes' inline anti-flash script is allowed by its hash in the
  // CloudFront CSP (no nonce in a static export).
  return (
    <html lang="en" className={manrope.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
