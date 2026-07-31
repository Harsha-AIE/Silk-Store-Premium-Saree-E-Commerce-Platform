import type { Metadata } from 'next';
import './globals.css';
import { SITE_NAME } from '@/lib/config';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: SITE_NAME,
  description: 'Luxury silk sarees for weddings, occasions, and modern elegance.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
