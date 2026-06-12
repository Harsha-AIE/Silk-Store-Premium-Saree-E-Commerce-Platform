import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: '#0B0B0B', color: '#F8F4EC' }}
    >
      <h1 style={{ fontSize: '48px', color: '#C8A96B', fontWeight: 300 }}>Not Found</h1>
      <p className="mt-4 mb-8" style={{ color: 'rgba(248,244,236,0.5)' }}>
        This page does not exist.
      </p>
      <Link href="/" className="no-underline" style={{ color: '#C8A96B', textTransform: 'uppercase', letterSpacing: '2px' }}>
        Return Home
      </Link>
    </div>
  );
}
