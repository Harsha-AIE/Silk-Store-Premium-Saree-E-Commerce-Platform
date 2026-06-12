import type { Metadata } from 'next';
import './globals.css';
import { SITE_NAME } from '@/lib/config';

export const metadata: Metadata = {
  title: SITE_NAME,
  description: 'Luxury silk sarees for weddings, occasions, and modern elegance.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
