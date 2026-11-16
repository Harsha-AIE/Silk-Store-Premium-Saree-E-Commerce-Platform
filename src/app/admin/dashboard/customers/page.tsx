import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: admin } = await supabase.from('admins')
    .select('id').eq('user_id', user.id).maybeSingle();
  if (!admin) redirect('/admin/login?error=not-admin');

  const { data: customers, error } = await supabase
    .from('customer_profiles')
    .select('id, full_name, email, created_at')
    .order('created_at', { ascending: false });

  const { data: staff } = await supabase.from('admins').select('user_id');
  const staffIds = new Set((staff ?? []).map(record => record.user_id));
  const customerAccounts = (customers ?? []).filter(customer => !staffIds.has(customer.id));

  // Resolve each customer's durable wishlist into saree names (admin-only view).
  const ids = customerAccounts.map(customer => customer.id);
  const { data: wishlists, error: wishlistError } = ids.length
    ? await supabase.from('wishlists').select('id, user_id').in('user_id', ids)
    : { data: [], error: null };
  const listIds = (wishlists ?? []).map(list => list.id);
  const { data: items, error: itemError } = listIds.length
    ? await supabase.from('wishlist_items').select('wishlist_id, saree_id').in('wishlist_id', listIds)
    : { data: [], error: null };
  const productIds = [...new Set((items ?? []).map(item => item.saree_id))];
  const { data: products, error: productError } = productIds.length
    ? await supabase.from('sarees').select('id, title, slug').in('id', productIds)
    : { data: [], error: null };
  const productById = new Map((products ?? []).map(product => [product.id, product]));
  const wishlistsByCustomer = new Map<string, { id: string; title: string; slug: string }[]>();
  for (const list of wishlists ?? []) {
    const saved = (items ?? [])
      .filter(item => item.wishlist_id === list.id)
      .map(item => productById.get(item.saree_id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    wishlistsByCustomer.set(list.user_id, saved);
  }
  const relatedError = wishlistError || itemError || productError;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl" style={{ color: '#C8A96B' }}>Customer Accounts</h1>
        <p className="text-sm mt-2" style={{ color: 'rgba(248,244,236,0.6)' }}>
          Saved customer profiles from Supabase. {customerAccounts.length} customers.
        </p>
      </div>
      {error || relatedError ? (
        <p role="alert" style={{ color: '#f87171' }}>
          Unable to load customer data: {(error || relatedError)?.message}. Run the customer accounts migration and verify Supabase database permissions.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid rgba(200,169,107,0.25)' }}>
          <table className="min-w-full text-left text-sm">
            <thead style={{ backgroundColor: '#191919', color: '#C8A96B' }}>
              <tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Joined</th><th className="p-4">Saved wishlist</th></tr>
            </thead>
            <tbody>
              {customerAccounts.map(customer => (
                <tr key={customer.id} style={{ borderTop: '1px solid rgba(200,169,107,0.15)' }}>
                  <td className="p-4">{customer.full_name || '—'}</td>
                  <td className="p-4">{customer.email}</td>
                  <td className="p-4">{new Date(customer.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}</td>
                  <td className="p-4">
                    {(wishlistsByCustomer.get(customer.id) ?? []).length ? (
                      <div className="flex flex-col gap-1">
                        {(wishlistsByCustomer.get(customer.id) ?? []).map(product => (
                          <a key={product.id} href={`/product/${product.slug}`} className="underline" style={{ color: '#C8A96B' }}>
                            {product.title}
                          </a>
                        ))}
                        <span className="text-xs opacity-60">{(wishlistsByCustomer.get(customer.id) ?? []).length} saved</span>
                      </div>
                    ) : <span className="opacity-60">No saved sarees</span>}
                  </td>
                </tr>
              ))}
              {!customerAccounts.length && (
                <tr><td colSpan={4} className="p-6 text-center">No accounts found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
