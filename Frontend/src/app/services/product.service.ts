import { Injectable, inject } from '@angular/core';
import { Observable, from, map, catchError, of } from 'rxjs';
import { Product } from '../models/product.model';
import { ApiService } from './api.service';

export interface PaginatedProductResponse {
    products: Product[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private apiService = inject(ApiService);

    getProducts(params?: {
        page?: number;
        limit?: number;
        filterType?: 'category' | 'metal' | 'metalPurity' | 'weight';
        filterValue?: string;
        availability?: string;
    }): Observable<PaginatedProductResponse> {
        return from(this.apiService.getProducts(params)).pipe(
            map((response: any) => {
                console.log('🔍 Raw API Response:', response);
                console.log('🔍 Response.data:', response.data);

                // Backend returns: { data: { success: true, message: "...", data: { products: [...], pagination: {...} } } }
                const outerData = response.data;

                // Check if there's a nested data object
                const innerData = outerData.data || outerData;
                console.log('🔍 Inner data:', innerData);

                // Products are in innerData.data (the array)
                const productsArray = Array.isArray(innerData.data) ? innerData.data : (innerData.products || []);
                const pagination = innerData.pagination;

                console.log('🔍 Products array:', productsArray);
                console.log('🔍 Products array length:', productsArray.length);
                console.log('🔍 Pagination:', pagination);

                // Map products and extract price from priceCalculation
                const mappedProducts = productsArray.map((product: any) => {
                    // Construct full image URLs
                    let images: string[] = [];
                    if (product.images && Array.isArray(product.images)) {
                        images = product.images.map((img: string) => {
                            if (img.startsWith('http')) return img;
                            if (img.startsWith('/')) return `http://localhost:5000${img}`;
                            // If it's just a filename, prepend the uploads path
                            return `http://localhost:5000/uploads/products/${img}`;
                        });
                    } else if (product.image) {
                        let imgUrl = product.image;
                        if (!imgUrl.startsWith('http')) {
                            if (imgUrl.startsWith('/')) {
                                imgUrl = `http://localhost:5000${imgUrl}`;
                            } else {
                                // If it's just a filename, prepend the uploads path
                                imgUrl = `http://localhost:5000/uploads/products/${imgUrl}`;
                            }
                        }
                        images = [imgUrl];
                    }

                    return {
                        ...product,
                        id: product.id?.toString() || '',
                        price: product.priceCalculation?.finalPrice || 0,
                        images: images,
                        rating: product.rating || 4,
                        reviewCount: product.reviewCount || 0,
                        bestseller: product.bestseller || false,
                        featured: product.featured || false,
                        inStock: product.availability === 'YES',
                        variants: product.variants || [{
                            id: product.id?.toString() || '1',
                            material: product.metal || 'Gold',
                            price: product.priceCalculation?.finalPrice || 0,
                            stock: product.availability === 'YES' ? 10 : 0
                        }],
                        createdAt: product.created_at || new Date().toISOString()
                    };
                });

                const result = {
                    products: mappedProducts,
                    pagination: {
                        currentPage: pagination?.currentPage || params?.page || 1,
                        totalPages: pagination?.totalPages || 1,
                        totalItems: pagination?.totalItems || productsArray.length,
                        itemsPerPage: pagination?.itemsPerPage || params?.limit || 10
                    }
                };

                console.log('🔍 Final result:', result);
                console.log('🔍 Mapped products count:', result.products.length);
                return result;
            }),
            catchError(error => {
                console.error('Error fetching products:', error);
                return of({
                    products: [],
                    pagination: {
                        currentPage: 1,
                        totalPages: 0,
                        totalItems: 0,
                        itemsPerPage: 10
                    }
                });
            })
        );
    }

    getFeaturedCollections() {
        return of([
            {
                id: 'rings',
                name: 'Royal Rings',
                description: 'Explore our exquisite collection of handcrafted rings, featuring timeless designs and precious stones.',
                image: '/images/collection-rings.jpg'
            },
            {
                id: 'necklaces',
                name: 'Elegant Necklaces',
                description: 'Adorn yourself with our stunning necklaces, curated to add a touch of sophistication to any occasion.',
                image: '/images/collection-necklaces.jpg'
            },
            {
                id: 'earrings',
                name: 'Timeless Earrings',
                description: 'Discover the perfect pair of earrings to complement your style, from classic studs to statement drops.',
                image: '/images/collection-earrings.jpg'
            }
        ]);
    }

    getProductById(id: string): Observable<Product | undefined> {
        return from(this.apiService.getProductById(id)).pipe(
            map((response: any) => {
                console.log('🔍 Product Details API Response:', response.data);

                // Try multiple paths to find the product object
                let productData = response.data?.data?.product || response.data?.product;

                // Handle case where it might be in an array (like getProducts response)
                if (!productData) {
                    const potentialData = response.data?.data || response.data;
                    if (Array.isArray(potentialData) && potentialData.length > 0) {
                        productData = potentialData[0];
                    } else if (potentialData?.products && Array.isArray(potentialData.products)) {
                        productData = potentialData.products.find((p: any) => p.id == id) || potentialData.products[0];
                    }
                }

                if (!productData) {
                    console.error('❌ Could not find product data in response', response.data);
                    return undefined;
                }

                console.log('✅ Found product data:', productData);

                // Construct full image URLs
                let images: string[] = [];
                if (productData.images && Array.isArray(productData.images)) {
                    images = productData.images.map((img: string) => {
                        if (img.startsWith('http')) return img;
                        if (img.startsWith('/')) return `http://localhost:5000${img}`;
                        // If it's just a filename, prepend the uploads path
                        return `http://localhost:5000/uploads/products/${img}`;
                    });
                } else if (productData.image) {
                    let imgUrl = productData.image;
                    if (!imgUrl.startsWith('http')) {
                        if (imgUrl.startsWith('/')) {
                            imgUrl = `http://localhost:5000${imgUrl}`;
                        } else {
                            // If it's just a filename, prepend the uploads path
                            imgUrl = `http://localhost:5000/uploads/products/${imgUrl}`;
                        }
                    }
                    images = [imgUrl];
                }

                // Map backend product to frontend format with price calculation
                const mappedProduct = {
                    ...productData,
                    id: productData.id?.toString() || '',
                    // Map generic fields
                    name: productData.name || '',
                    category: (productData.category || 'RINGS').toUpperCase(),
                    description: productData.description || '',
                    // Map weight/grams mismatch
                    weight: productData.weight ? Number(productData.weight) : (productData.grams ? Number(productData.grams) : 0),
                    // Map technical details
                    metal: productData.metal,
                    metal_purity: productData.metal_purity,
                    wastage: productData.wastage ? Number(productData.wastage) : 0,

                    price: productData.priceCalculation?.finalPrice || 0,
                    images: images,
                    rating: productData.rating || 4,
                    reviewCount: productData.reviewCount || 0,
                    bestseller: productData.bestseller || false,
                    featured: productData.featured || false,
                    inStock: productData.availability === 'YES',
                    variants: productData.variants || [{
                        id: productData.id?.toString() || '1',
                        material: productData.metal || 'Gold',
                        price: productData.priceCalculation?.finalPrice || 0,
                        stock: productData.availability === 'YES' ? 10 : 0
                    }],
                    createdAt: productData.created_at || new Date().toISOString(),
                    // Store price calculation for display
                    priceCalculation: productData.priceCalculation,
                    // Keep original availability
                    availability: productData.availability || 'YES'
                };

                console.log('✅ Mapped Product for Edit:', mappedProduct);
                return mappedProduct;
            }),
            catchError(() => of(undefined))
        );
    }

    addProduct(productData: any, imageFiles: File[]): Observable<any> {
        const formData = this.buildFormData(productData, imageFiles);
        return from(this.apiService.createProduct(formData)).pipe(
            map((response: any) => response.data),
            catchError(error => {
                console.error('Error creating product:', error);
                throw error;
            })
        );
    }

    updateProduct(id: string, productData: any, imageFiles: File[]): Observable<any> {
        const formData = this.buildFormData(productData, imageFiles);
        return from(this.apiService.updateProduct(id, formData)).pipe(
            map((response: any) => response.data),
            catchError(error => {
                console.error('Error updating product:', error);
                throw error;
            })
        );
    }

    private buildFormData(productData: any, imageFiles: File[]): FormData {
        const formData = new FormData();

        // Required fields
        formData.append('name', productData.name || '');
        formData.append('weight', productData.weight?.toString() || '0');
        formData.append('grams', productData.weight?.toString() || '0'); // Backend expects grams
        formData.append('wastage', productData.wastage?.toString() || '0');
        formData.append('category', productData.category || 'RINGS');

        // Optional fields
        if (productData.metal) {
            formData.append('metal', productData.metal);
        }
        if (productData.metal_purity) {
            formData.append('metal_purity', productData.metal_purity.toString());
        }
        if (productData.description) {
            formData.append('description', productData.description);
        }

        // Availability
        formData.append('availability', productData.availability || 'YES');

        // Image files - append multiple images
        if (imageFiles && imageFiles.length > 0) {
            imageFiles.forEach((file, index) => {
                formData.append('images', file);
            });
        }

        return formData;
    }

    deleteProduct(id: string): Observable<boolean> {
        return from(this.apiService.deleteProduct(id)).pipe(
            map(() => true),
            catchError(() => of(false))
        );
    }
}
