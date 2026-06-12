import Navbar from '@/components/user/Navbar';
import { WishlistProvider } from '@/components/user/WishlistProvider';
import AuthPrompt from '@/components/user/AuthPrompt';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <WishlistProvider>
      <div
        style={{
          backgroundColor: '#0B0B0B',
          color: '#F8F4EC',
          minHeight: '100vh',
          fontFamily: "'Inter', 'Cormorant Garamond', serif",
        }}
      >
        <Navbar />
        {children}
        <AuthPrompt />
      </div>
    </WishlistProvider>
  );
}
