export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parsePriceInput(value: string): number {
  const num = parseFloat(value.replace(/[^\d.]/g, ''));
  return Number.isFinite(num) ? num : 0;
}

export function generateShareToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='800'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%231a0505'/%3E%3Cstop offset='100%25' stop-color='%230B0B0B'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='600' height='800' fill='url(%23g)'/%3E%3Ctext x='50%25' y='48%25' dominant-baseline='middle' text-anchor='middle' fill='%23C8A96B' font-family='serif' font-size='20' opacity='0.6'%3EDhanunjaya%3C/text%3E%3Ctext x='50%25' y='53%25' dominant-baseline='middle' text-anchor='middle' fill='%23C8A96B' font-family='serif' font-size='13' opacity='0.4'%3ESilk Sarees%3C/text%3E%3C/svg%3E";

export function getSareePrimaryImage(saree: { images?: { url: string; is_primary: boolean; sort_order: number }[] }): string {
  const images = saree.images ?? [];
  if (images.length === 0) return PLACEHOLDER_IMAGE;
  const sorted = [...images].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.sort_order - b.sort_order;
  });
  return sorted[0]?.url ?? PLACEHOLDER_IMAGE;
}
