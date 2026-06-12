export const STORAGE_PREFIX = 'dhanunjaya-img-';

const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='800'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%231a0505'/%3E%3Cstop offset='100%25' stop-color='%230B0B0B'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='600' height='800' fill='url(%23g)'/%3E%3Cline x1='0' y1='400' x2='600' y2='380' stroke='%23C8A96B' stroke-opacity='0.08' stroke-width='1'/%3E%3Ctext x='50%25' y='48%25' dominant-baseline='middle' text-anchor='middle' fill='%23C8A96B' font-family='serif' font-size='20' opacity='0.6'%3EDhanunjaya%3C/text%3E%3Ctext x='50%25' y='53%25' dominant-baseline='middle' text-anchor='middle' fill='%23C8A96B' font-family='serif' font-size='13' opacity='0.4'%3ESilk Sarees%3C/text%3E%3C/svg%3E`;

export function getImageUrl(imageId: string): string {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem(`${STORAGE_PREFIX}${imageId}`);
  if (stored) return stored;
  return PLACEHOLDER_SVG;
}

export function saveImage(imageId: string, base64: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${STORAGE_PREFIX}${imageId}`, base64);
}

export function hasImage(imageId: string): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(`${STORAGE_PREFIX}${imageId}`);
}

export function deleteImage(imageId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${STORAGE_PREFIX}${imageId}`);
}
