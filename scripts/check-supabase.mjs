import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { lookup } from 'node:dns/promises';
import { createClient } from '@supabase/supabase-js';

const root = process.cwd();
const envFiles = ['.env', '.env.local'];

function parseEnvFile(file) {
  const path = resolve(root, file);
  if (!existsSync(path)) return {};

  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    env[key] = value;
  }
  return env;
}

function projectRefFromUrl(url) {
  return url?.match(/^https:\/\/([^.]+)\.supabase\.co\/?$/)?.[1] ?? null;
}

function projectRefFromJwt(jwt) {
  const [, payload] = jwt.split('.');
  if (!payload) return null;

  try {
    const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(json).ref ?? null;
  } catch {
    return null;
  }
}

function maskKey(key) {
  if (!key) return '(missing)';
  return `${key.slice(0, 10)}...${key.slice(-8)}`;
}

function loadEnv() {
  const merged = {};
  const sources = {};

  for (const file of envFiles) {
    const parsed = parseEnvFile(file);
    for (const [key, value] of Object.entries(parsed)) {
      merged[key] = value;
      sources[key] = file;
    }
  }

  return { merged, sources };
}

async function check(label, task) {
  process.stdout.write(`${label} ... `);
  try {
    const result = await task();
    console.log('OK');
    if (result) console.log(result);
    return true;
  } catch (error) {
    console.log('FAIL');
    console.log(error instanceof Error ? error.message : error);
    return false;
  }
}

const { merged, sources } = loadEnv();
const shouldWriteCategory = process.argv.includes('--write-category');
const shouldWriteAdmin = process.argv.includes('--write-admin');
const url = merged.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = merged.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const publishableKey = merged.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const publicKey = publishableKey || anonKey;
const secretKey = merged.SUPABASE_SERVICE_ROLE_KEY || merged.SUPABASE_SECRET_KEY;
const urlRef = projectRefFromUrl(url);
const keyRef = anonKey?.startsWith('eyJ') ? projectRefFromJwt(anonKey) : null;
const keyType = publishableKey?.startsWith('sb_publishable_')
  ? 'publishable'
  : anonKey?.startsWith('eyJ')
    ? 'jwt-anon'
    : 'unknown';

console.log('Supabase credential check');
console.log(`URL: ${url ?? '(missing)'} ${sources.NEXT_PUBLIC_SUPABASE_URL ? `from ${sources.NEXT_PUBLIC_SUPABASE_URL}` : ''}`);
console.log(`Public key: ${maskKey(publicKey)} (${keyType})`);
console.log(`URL project ref: ${urlRef ?? '(unknown)'}`);
console.log(`Key project ref: ${keyRef ?? '(unknown)'}`);

if (!url || !publicKey) {
  process.exitCode = 1;
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL and public key.');
}

if (!urlRef) {
  process.exitCode = 1;
  throw new Error('NEXT_PUBLIC_SUPABASE_URL must look like https://<project-ref>.supabase.co');
}

if (!anonKey?.startsWith('eyJ') && !publishableKey?.startsWith('sb_publishable_')) {
  process.exitCode = 1;
  throw new Error('Set NEXT_PUBLIC_SUPABASE_ANON_KEY to a JWT anon key or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to an sb_publishable key.');
}

if (keyRef && urlRef !== keyRef) {
  process.exitCode = 1;
  throw new Error(`Project mismatch: URL is ${urlRef}, but anon key is for ${keyRef}.`);
}

const hostname = new URL(url).hostname;
let failures = 0;

if (!(await check(`DNS lookup ${hostname}`, async () => {
  const result = await lookup(hostname);
  return `  address: ${result.address}`;
}))) failures++;

if (!(await check('HTTPS REST gateway', async () => {
  const response = await fetch(`${url}/rest/v1/`, {
    headers: {
      apikey: publicKey,
      authorization: `Bearer ${publicKey}`,
    },
  });
  if (!response.ok) {
    const text = await response.text();
    if (
      response.status === 401 &&
      publishableKey &&
      text.includes('Secret API key required')
    ) {
      return '  reachable; root endpoint requires a secret key with publishable-key projects';
    }
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 300)}`);
  }
  return `  HTTP ${response.status}`;
}))) failures++;

const supabase = createClient(url, publicKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

for (const table of ['categories', 'sarees', 'saree_images']) {
  if (!(await check(`Read table ${table}`, async () => {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true });
    if (error) throw new Error(`${error.message} (${error.code ?? 'no code'})`);
    return `  visible rows: ${count ?? 0}`;
  }))) failures++;
}

if (shouldWriteCategory) {
  if (!(await check('Write test category with current anon client', async () => {
    const stamp = Date.now();
    const name = `Supabase Check ${stamp}`;
    const slug = `supabase-check-${stamp}`;
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, slug })
      .select('id')
      .single();
    if (error) throw new Error(`${error.message} (${error.code ?? 'no code'})`);

    const { error: deleteError } = await supabase.from('categories').delete().eq('id', data.id);
    if (deleteError) throw new Error(`Inserted row ${data.id}, but cleanup failed: ${deleteError.message}`);

    return `  inserted and deleted category id: ${data.id}`;
  }))) failures++;
}

if (shouldWriteAdmin) {
  if (!(await check('Admin service write category + saree', async () => {
    if (!secretKey?.startsWith('sb_secret_') && !secretKey?.startsWith('eyJ')) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY.');
    }

    const admin = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const stamp = Date.now();
    const categoryName = `Supabase Admin Check ${stamp}`;
    const categorySlug = `supabase-admin-check-${stamp}`;
    const sareeSlug = `supabase-admin-check-saree-${stamp}`;
    let categoryId;
    let sareeId;

    const { data: category, error: categoryError } = await admin
      .from('categories')
      .insert({ name: categoryName, slug: categorySlug })
      .select('id')
      .single();
    if (categoryError) throw new Error(`category insert: ${categoryError.message}`);
    categoryId = category.id;

    try {
      const { data: saree, error: sareeError } = await admin
        .from('sarees')
        .insert({
          title: `Supabase Admin Check Saree ${stamp}`,
          slug: sareeSlug,
          price: 1,
          description: 'Temporary admin write check',
          category_id: categoryId,
          fabric: 'Silk',
          occasion: 'Test',
          colors: ['Gold'],
          featured: false,
          published: false,
        })
        .select('id')
        .single();
      if (sareeError) throw new Error(`saree insert: ${sareeError.message}`);
      sareeId = saree.id;
    } finally {
      if (sareeId) await admin.from('sarees').delete().eq('id', sareeId);
      if (categoryId) await admin.from('categories').delete().eq('id', categoryId);
    }

    return `  inserted and deleted category ${categoryId}; saree ${sareeId}`;
  }))) failures++;
}

if (!(await check('Auth endpoint', async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return `  anonymous session: ${data.session ? 'present' : 'none'}`;
}))) failures++;

if (failures > 0) {
  console.log('\nResult: Supabase is not fully reachable/usable from this machine.');
  process.exitCode = 1;
} else {
  console.log('\nResult: Credentials and read access look valid.');
  console.log('Note: admin writes still require a real authenticated admin session or service-role server mutations.');
  console.log('To test anonymous admin writes explicitly, run: npm run check:supabase -- --write-category');
  console.log('To test server-side admin writes, run: npm run check:supabase -- --write-admin');
}
