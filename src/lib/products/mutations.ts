'use server';

import { randomUUID } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import type { Category, SareeFormInput } from '@/types/database';
import { slugify } from '@/lib/utils';

type MutationResult<T = unknown> = {
  data: T | null;
  error: { message: string } | null;
};

function getAdminSupabase() {
  const supabase = createServiceClient();
  if (!supabase) {
    throw new Error('Missing Supabase secret key. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY in .env.local.');
  }
  return supabase;
}

async function requireAdmin() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Admin login required');
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!admin) {
    throw new Error('Admin access required');
  }
}

function toResult<T>(data: T | null, error: { message: string } | null): MutationResult<T> {
  return { data, error: error ? { message: error.message } : null };
}

export async function createCategory(name: string, imageUrl?: string): Promise<MutationResult> {
  try {
    await requireAdmin();
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name,
        slug: slugify(name),
        image_url: imageUrl ?? null,
      })
      .select()
      .single();

    return toResult(data, error);
  } catch (error) {
    return toResult(null, { message: error instanceof Error ? error.message : 'Failed to create category' });
  }
}

export async function updateCategory(
  id: string,
  updates: Partial<Category>
): Promise<MutationResult> {
  try {
    await requireAdmin();
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return toResult(data, error);
  } catch (error) {
    return toResult(null, { message: error instanceof Error ? error.message : 'Failed to update category' });
  }
}

export async function deleteCategory(id: string): Promise<MutationResult> {
  try {
    await requireAdmin();
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from('categories').delete().eq('id', id).select();
    return toResult(data, error);
  } catch (error) {
    return toResult(null, { message: error instanceof Error ? error.message : 'Failed to delete category' });
  }
}

export async function createSaree(input: SareeFormInput): Promise<MutationResult<{ id: string }>> {
  try {
    await requireAdmin();
    const supabase = getAdminSupabase();
    // Two sarees can legitimately have the same display title. Keep the clean
    // slug where possible; on a unique collision assign a short random suffix.
    const baseSlug = slugify(input.title) || 'saree';
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = attempt === 0 ? baseSlug : `${baseSlug}-${randomUUID().slice(0, 8)}`;
      const { data, error } = await supabase
        .from('sarees')
        .insert({
          ...input,
          category_id: input.category_id || null,
          slug,
          colors: input.colors,
        })
        .select('id')
        .single();
      if (!error) return toResult(data, null);
      if (error.code !== '23505') return toResult(null, error);
    }
    return toResult(null, { message: 'Unable to generate a unique saree URL. Please retry.' });
  } catch (error) {
    return toResult<{ id: string }>(
      null,
      { message: error instanceof Error ? error.message : 'Failed to create saree' }
    );
  }
}

export async function updateSaree(
  id: string,
  input: Partial<SareeFormInput>
): Promise<MutationResult> {
  try {
    await requireAdmin();
    const supabase = getAdminSupabase();
    const updates: Record<string, unknown> = { ...input, updated_at: new Date().toISOString() };
    if (input.title) updates.slug = slugify(input.title);
    if (input.category_id === '') updates.category_id = null;

    const { data, error } = await supabase.from('sarees').update(updates).eq('id', id).select();
    return toResult(data, error);
  } catch (error) {
    return toResult(null, { message: error instanceof Error ? error.message : 'Failed to update saree' });
  }
}

export async function deleteSaree(id: string): Promise<MutationResult> {
  try {
    await requireAdmin();
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from('sarees').delete().eq('id', id).select();
    return toResult(data, error);
  } catch (error) {
    return toResult(null, { message: error instanceof Error ? error.message : 'Failed to delete saree' });
  }
}

export async function uploadCategoryImage(categoryId: string, file: File): Promise<MutationResult> {
  try {
    await requireAdmin();
    const supabase = getAdminSupabase();
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `categories/${categoryId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('saree_images')
      .upload(path, file, { upsert: false });

    if (uploadError) return toResult(null, uploadError);

    const { data: urlData } = supabase.storage.from('saree_images').getPublicUrl(path);
    const { data, error } = await supabase
      .from('categories')
      .update({ image_url: urlData.publicUrl })
      .eq('id', categoryId)
      .select()
      .single();

    return toResult(data, error);
  } catch (error) {
    return toResult(null, { message: error instanceof Error ? error.message : 'Failed to upload category image' });
  }
}

export async function createSareeImageUpload(
  sareeId: string,
  fileName: string,
  contentType: string
): Promise<MutationResult<{ path: string; token: string }>> {
  try {
    await requireAdmin();

    const supabase = getAdminSupabase();

    const allowedTypes: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/avif': 'avif',
    };

    const ext = allowedTypes[contentType];

    if (!ext) {
      throw new Error('Unsupported image format.');
    }

    const { data: saree, error: sareeError } = await supabase
      .from('sarees')
      .select('id')
      .eq('id', sareeId)
      .maybeSingle();

    if (sareeError) return toResult<{ path: string; token: string }>(null, sareeError);

    if (!saree) {
      throw new Error('Saree not found.');
    }

    const path = `${sareeId}/${randomUUID()}.${ext}`;

    const { data, error } = await supabase.storage.from('saree_images').createSignedUploadUrl(path);

    if (error) return toResult<{ path: string; token: string }>(null, error);

    return toResult({ path: data.path, token: data.token }, null);
  } catch (error) {
    return toResult<{ path: string; token: string }>(null, {
      message: error instanceof Error ? error.message : 'Failed to generate upload permission',
    });
  }
}

export async function saveSareeImageRecord(
  sareeId: string,
  storagePath: string,
  sortOrder: number,
  isPrimary: boolean
): Promise<MutationResult> {
  try {
    await requireAdmin();

    const supabase = getAdminSupabase();

    if (!storagePath.startsWith(`${sareeId}/`) || storagePath.includes('..')) {
      throw new Error('Invalid image storage path.');
    }

    const { data: urlData } = supabase.storage.from('saree_images').getPublicUrl(storagePath);

    const { data, error } = await supabase
      .from('saree_images')
      .insert({
        saree_id: sareeId,
        url: urlData.publicUrl,
        storage_path: storagePath,
        sort_order: sortOrder,
        is_primary: isPrimary,
      })
      .select()
      .single();

    if (error) {
      await supabase.storage.from('saree_images').remove([storagePath]);
      return toResult(null, error);
    }

    return toResult(data, null);
  } catch (error) {
    return toResult(null, {
      message: error instanceof Error ? error.message : 'Failed to save image details',
    });
  }
}

export async function deleteSareeImage(
  imageId: string,
  storagePath: string | null
): Promise<MutationResult> {
  try {
    await requireAdmin();
    const supabase = getAdminSupabase();
    if (storagePath) {
      const { error } = await supabase.storage.from('saree_images').remove([storagePath]);
      if (error) return toResult(null, error);
    }

    const { data, error } = await supabase.from('saree_images').delete().eq('id', imageId).select();
    return toResult(data, error);
  } catch (error) {
    return toResult(null, { message: error instanceof Error ? error.message : 'Failed to delete saree image' });
  }
}
