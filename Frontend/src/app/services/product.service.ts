import { Injectable, inject } from '@angular/core';
import { Observable, from, map, catchError, of, delay, switchMap, timeout } from 'rxjs';
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
        categories?: string[];
        metals?: string[];
        purities?: string[];
        weightRanges?: any[];
        search?: string;
        availability?: string;
    }): Observable<PaginatedProductResponse> {
        return from(this.apiService.getProducts(params as any)).pipe(
            map((response: any) => this.processProductResponse(response, params)),
            catchError(error => {
                console.error('Error fetching products:', error);
                return of(this.getEmptyResponse());
            })
        );
    }

    getFilterOptions(): Observable<any> {
        return from(this.apiService.getFilterOptions()).pipe(
            map((response: any) => response.data?.data || response.data),
            catchError(error => {
                console.error('Error fetching filter options:', error);
                return of({ categories: [], metals: [], purities: [] });
            })
        );
    }

    getTopSellingProducts(params?: any): Observable<PaginatedProductResponse> {
        return from(this.apiService.getTopSellingProducts(params)).pipe(
            map((response: any) => this.processProductResponse(response, params)),
            catchError(error => {
                console.error('Error fetching best sellers:', error);
                // Return empty response on error if strict mode, or re-throw
                return of(this.getEmptyResponse());
            })
        );
    }

    getFeaturedProducts(params?: any): Observable<PaginatedProductResponse> {
        return from(this.apiService.getFeaturedProducts(params)).pipe(
            map((response: any) => this.processProductResponse(response, params)),
            catchError(error => {
                console.error('Error fetching featured products:', error);
                return of(this.getEmptyResponse());
            })
        );
    }

    updateProductStatus(id: string, data: any): Observable<Product> {
        return from(this.apiService.updateProductStatus(id, data)).pipe(
            map((response: any) => {
                const productData = response.data?.product || response.data;
                // Re-process checking logic would be redundant if we just call processProductResponse logic 
                // but processProductResponse expects a PaginatedResponse structure partially.
                // Let's manually map or reuse logic carefully.
                // For simplicity, let's just map this single product similarly.

                // We'll create a mini-processor or just do it here.
                return this.mapSingleProduct(productData);
            }),
            catchError(error => {
                console.error('Error updating product:', error);
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

    private mapSingleProduct(product: any): Product {
        // Construct full image URLs
        let images: string[] = [];
        if (product.images && Array.isArray(product.images)) {
            images = product.images.map((img: string) => {
                if (img.startsWith('http')) return img;
                if (img.startsWith('/')) return `http://localhost:5000${img}`;
                return `http://localhost:5000/uploads/products/${img}`;
            });
        } else if (product.image) {
            let imgSource = product.image;
            // Check if image is a stringified array "['img1.jpg', 'img2.jpg']"
            if (typeof imgSource === 'string' && imgSource.trim().startsWith('[') && imgSource.trim().endsWith(']')) {
                try {
                    const parsed = JSON.parse(imgSource);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        imgSource = parsed[0];
                    }
                } catch (e) {
                    console.warn('Failed to parse image JSON string:', imgSource);
                }
            }

            let imgUrl = imgSource;
            if (typeof imgUrl === 'string' && !imgUrl.startsWith('http')) {
                if (imgUrl.startsWith('/')) {
                    imgUrl = `http://localhost:5000${imgUrl}`;
                } else {
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
            bestseller: this.parseBoolean(product.bestseller) || this.parseBoolean(product.top_selling),
            featured: this.parseBoolean(product.featured),
            inStock: product.availability === 'YES',
            variants: product.variants || [{
                id: product.id?.toString() || '1',
                material: product.metal || 'Gold',
                price: product.priceCalculation?.finalPrice || 0,
                stock: product.availability === 'YES' ? 10 : 0
            }],
            createdAt: product.created_at || new Date().toISOString()
        };
    }

    private parseBoolean(value: any): boolean {
        if (!value) return false;

        // Handle Buffer/Bit field from DB: { type: 'Buffer', data: [1] }
        if (typeof value === 'object' && value.type === 'Buffer' && Array.isArray(value.data)) {
            return value.data[0] === 1;
        }

        if (value === 1 || value === '1' || value === true || value === 'true') {
            return true;
        }

        return false;
    }

    public processProductResponse(response: any, params?: any): PaginatedProductResponse {
        if (!response || !response.data) {
            return this.getEmptyResponse();
        }

        const outerData = response.data;
        // Check if there's a nested data object
        const innerData = outerData.data || outerData;

        if (!innerData) {
            return this.getEmptyResponse();
        }

        // Products are in innerData.data (the array), or innerData.products, or innerData itself if it's an array
        let productsArray: any[] = [];
        if (Array.isArray(innerData)) {
            productsArray = innerData;
        } else if (innerData.data && Array.isArray(innerData.data)) {
            productsArray = innerData.data;
        } else if (innerData.products && Array.isArray(innerData.products)) {
            productsArray = innerData.products;
        }

        const pagination = innerData.pagination || {};

        // Map products and extract price from priceCalculation
        const mappedProducts = productsArray.map((product: any) => this.mapSingleProduct(product));

        const result = {
            products: mappedProducts,
            pagination: {
                currentPage: pagination?.currentPage || params?.page || 1,
                totalPages: pagination?.totalPages || 1,
                totalItems: pagination?.totalItems || productsArray.length,
                itemsPerPage: pagination?.itemsPerPage || params?.limit || 10
            }
        };

        return result;
    }

    public getEmptyResponse(): PaginatedProductResponse {
        return {
            products: [],
            pagination: {
                currentPage: 1,
                totalPages: 0,
                totalItems: 0,
                itemsPerPage: 10
            }
        };
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
                    category: productData.waste_id || productData.category || 'RINGS',
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



    private buildFormData(productData: any, imageFiles: File[]): FormData {
        const formData = new FormData();

        // Required fields
        formData.append('name', productData.name || '');
        formData.append('weight', productData.weight?.toString() || '0');
        formData.append('grams', productData.weight?.toString() || '0'); // Backend expects grams
        formData.append('wastage', productData.wastage?.toString() || '0');
        formData.append('waste_id', productData.category || productData.waste_id);

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
