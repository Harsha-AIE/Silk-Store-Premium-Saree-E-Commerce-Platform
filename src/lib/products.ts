import { products, categories } from '../data/products';
import type { Product, Category } from '../types/product';

export async function fetchAllProducts(): Promise<Product[]> {
  return [...products];
}

export async function fetchProductById(id: string): Promise<Product | undefined> {
  return products.find(p => p.id === id);
}

export async function fetchProductsByCategory(category: string): Promise<Product[]> {
  return products.filter(p => p.category === category);
}

export async function fetchRelatedProducts(id: string, category: string): Promise<Product[]> {
  return products.filter(p => p.category === category && p.id !== id).slice(0, 4);
}

export async function fetchAllCategories(): Promise<Category[]> {
  return [...categories];
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
  return products.slice(0, 6);
}
