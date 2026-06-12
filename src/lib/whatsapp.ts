import { getSiteUrl, getWhatsAppPhone } from './config';

export function buildWhatsAppUrl(message: string): string {
  const phone = getWhatsAppPhone();
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function buildProductInquiryUrl(productSlug: string, productTitle: string): string {
  const link = `${getSiteUrl()}/product/${productSlug}`;
  const message = `Hi, I'm interested in this saree:\n${productTitle}\n${link}`;
  return buildWhatsAppUrl(message);
}

export function buildWishlistShareUrl(shareToken: string): string {
  const link = `${getSiteUrl()}/wishlist/${shareToken}`;
  const message = `Hi, here is my selected saree wishlist:\n${link}`;
  return buildWhatsAppUrl(message);
}

export function buildContactUrl(): string {
  return `https://wa.me/${getWhatsAppPhone()}`;
}
