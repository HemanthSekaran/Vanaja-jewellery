export interface ProductVariant {
  id: string;
  size?: string;
  material: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  imageMetadata?: { name: string, size: string }[];
  description: string;
  category: string;
  materials: string[];
  metalType: ('Gold' | 'Silver')[];
  weight: number;
  purity: '18K' | '22K' | '24K' | '925 Silver';
  makingCharges: number;
  wastagePercentage: number;
  stonePrice?: number;
  variants: ProductVariant[];
  featured: boolean;
  bestseller: boolean;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  createdAt: string;

  // Backend database fields
  wastage?: number;
  availability?: 'YES' | 'NO';
  metal?: string;
  metal_purity?: number;
}

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export interface WishlistItem {
  product: Product;
  addedAt: string;
}

export interface FilterOptions {
  categories: string[];
  metalTypes: string[];
  priceRange: [number, number];
  sortBy: 'price-low-high' | 'price-high-low' | 'newest' | 'bestsellers';
}
