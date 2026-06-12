import type { Category, Saree } from '@/types/database';
import { slugify } from '@/lib/utils';

type LegacyProduct = {
  id: string;
  name: string;
  category: string;
  price: string;
  fabric: string;
  occasion: string;
  color: string;
  imageId: string;
  description: string;
};

const legacyProducts: LegacyProduct[] = [
  { id: 'bridal-red-1', name: 'Royal Bridal Banarasi', category: 'Bridal Silk', price: '₹45,000', fabric: 'Pure Banarasi Silk', occasion: 'Bridal / Wedding', color: 'Deep Red', imageId: 'bridal-red-1', description: 'A refined bridal silk saree crafted for grand weddings, featuring rich zari borders and deep jewel tones that embody timeless tradition.' },
  { id: 'bridal-maroon-2', name: 'Maharani Bridal Silk', category: 'Bridal Silk', price: '₹52,000', fabric: 'Kanchipuram Silk', occasion: 'Bridal / Reception', color: 'Maroon', imageId: 'bridal-maroon-2', description: 'An opulent Kanchipuram silk with intricate temple borders, woven for the bride who commands every gaze in the room.' },
  { id: 'designer-peach-1', name: 'Ethereal Designer Drape', category: 'Designer Silk', price: '₹28,500', fabric: 'Silk Blend', occasion: 'Reception / Cocktail', color: 'Peach Gold', imageId: 'designer-peach-1', description: 'A contemporary designer silk with delicate embroidery and modern pallu art, perfect for the stylish modern woman.' },
  { id: 'designer-teal-2', name: 'Midnight Teal Elegance', category: 'Designer Silk', price: '₹32,000', fabric: 'Pure Silk', occasion: 'Party / Sangeet', color: 'Teal', imageId: 'designer-teal-2', description: 'Bold teal silk with statement zari work and a contemporary motif — designed for celebrations that demand attention.' },
  { id: 'wedding-pink-1', name: 'Blushing Rose Wedding Silk', category: 'Wedding Collection', price: '₹38,000', fabric: 'Pure Silk', occasion: 'Wedding / Engagement', color: 'Rose Pink', imageId: 'wedding-pink-1', description: 'A soft rose pink wedding silk with golden zari butis and a grand pallu, woven for the most cherished ceremonies.' },
  { id: 'wedding-gold-2', name: 'Golden Temple Wedding Silk', category: 'Wedding Collection', price: '₹42,000', fabric: 'Kanchipuram Silk', occasion: 'Wedding / Muhurtam', color: 'Gold', imageId: 'wedding-gold-2', description: 'A resplendent gold Kanchipuram silk with traditional temple motifs, the quintessential wedding drape.' },
  { id: 'traditional-green-1', name: 'Heritage Pochampally Silk', category: 'Traditional Collection', price: '₹18,500', fabric: 'Pochampally Silk', occasion: 'Festive / Puja', color: 'Emerald Green', imageId: 'traditional-green-1', description: "A handwoven Pochampally ikat silk with geometric patterns, rooted in Telangana's rich weaving heritage." },
  { id: 'party-purple-1', name: 'Regal Purple Party Silk', category: 'Party Wear', price: '₹22,000', fabric: 'Silk Blend', occasion: 'Party / Reception', color: 'Royal Purple', imageId: 'party-purple-1', description: 'A striking purple silk with contemporary border work, ideal for evening celebrations and cocktail events.' },
  { id: 'soft-cream-1', name: 'Ivory Soft Silk Classic', category: 'Soft Silk', price: '₹15,000', fabric: 'Soft Silk', occasion: 'Daily / Office', color: 'Ivory Cream', imageId: 'soft-cream-1', description: 'A lightweight soft silk in ivory cream with minimal zari — elegance for everyday grace.' },
  { id: 'exclusive-black-1', name: 'Noir Exclusive Banarasi', category: 'Exclusive Collection', price: '₹55,000', fabric: 'Pure Banarasi Silk', occasion: 'Gala / Reception', color: 'Black Gold', imageId: 'exclusive-black-1', description: 'A rare black Banarasi silk with gold zari — an exclusive piece for the connoisseur of fine drapes.' },
  { id: 'festive-orange-1', name: 'Sunset Festive Kanjeevaram', category: 'Festive Collection', price: '₹35,000', fabric: 'Kanchipuram Silk', occasion: 'Festive / Navratri', color: 'Sunset Orange', imageId: 'festive-orange-1', description: 'Vibrant orange Kanjeevaram with traditional motifs — the perfect festive statement saree.' },
  { id: 'festive-magenta-2', name: 'Magenta Festive Silk', category: 'Festive Collection', price: '₹30,000', fabric: 'Pure Silk', occasion: 'Festive / Diwali', color: 'Magenta', imageId: 'festive-magenta-2', description: 'Rich magenta silk with contrast pallu and temple border — celebration woven in silk.' },
];

const categoryNames = [
  'Bridal Silk',
  'Wedding Collection',
  'Designer Silk',
  'Festive Collection',
  'Traditional Collection',
  'Party Wear',
  'Soft Silk',
  'Exclusive Collection',
];

function parseLegacyPrice(price: string): number {
  return parseInt(price.replace(/[^\d]/g, ''), 10) || 0;
}

export function getFallbackCategories(): Category[] {
  return categoryNames.map((name, i) => ({
    id: `fallback-cat-${slugify(name)}`,
    name,
    slug: slugify(name),
    image_url: null,
    sort_order: i,
    created_at: new Date().toISOString(),
  }));
}

export function getFallbackSarees(): Saree[] {
  const categories = getFallbackCategories();
  return legacyProducts.map((p, i) => {
    const cat = categories.find(c => c.name === p.category);
    return {
      id: `fallback-${p.id}`,
      slug: p.id,
      title: p.name,
      price: parseLegacyPrice(p.price),
      description: p.description,
      category_id: cat?.id ?? null,
      fabric: p.fabric,
      occasion: p.occasion,
      colors: [p.color],
      featured: i < 6,
      published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category: cat ?? null,
      images: [],
    };
  });
}
