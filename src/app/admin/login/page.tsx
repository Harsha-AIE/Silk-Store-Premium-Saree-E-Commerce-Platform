import { Suspense } from 'react';
import AdminLoginForm from '@/components/admin/AdminLoginForm';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: '#0B0B0B' }} />}>
      <AdminLoginForm />
    </Suspense>
  );
}
