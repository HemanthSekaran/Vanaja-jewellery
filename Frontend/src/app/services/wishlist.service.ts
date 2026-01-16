import { Injectable, signal, computed, inject } from '@angular/core';
import { Product, WishlistItem } from '../models/product.model';
import { ApiService } from './api.service';
import { ProductService } from './product.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class WishlistService {
    private apiService = inject(ApiService);
    private productService = inject(ProductService);
    private wishlistItems = signal<WishlistItem[]>([]);

    public readonly items = computed(() => this.wishlistItems());
    public readonly count = computed(() => this.wishlistItems().length);

    constructor() {
        this.loadInitialWishlist();
    }

    private async loadInitialWishlist() {
        try {
            const res = await this.apiService.getWishlist();
            const products = res.data?.products || [];

            const items: WishlistItem[] = products.map((product: any) => {
                // Ensure variants are parsed if they come as string
                if (typeof product.variants === 'string') {
                    try { product.variants = JSON.parse(product.variants); } catch (e) { }
                }

                return {
                    product: product,
                    addedAt: new Date().toISOString()
                };
            });

            this.wishlistItems.set(items);
        } catch (e) {
            console.warn('Could not load wishlist from API', e);
        }
    }

    addToWishlist(product: Product) {
        this.wishlistItems.update(items => {
            if (items.some(item => item.product.id === product.id)) {
                return items;
            }
            const newItems = [...items, { product, addedAt: new Date().toISOString() }];
            this.syncToDb(newItems);
            return newItems;
        });
    }

    removeFromWishlist(productId: string) {
        this.wishlistItems.update(items => {
            const newItems = items.filter(item => item.product.id !== productId);
            this.syncToDb(newItems);
            return newItems;
        });
    }

    isInWishlist(productId: string): boolean {
        return this.wishlistItems().some(item => item.product.id === productId);
    }

    private syncToDb(items: WishlistItem[]) {
        // Map to strictly array of strings: ['id1', 'id2']
        const ids = items.map(item => item.product.id);

        this.apiService.updateProfile({ wishlist: ids })
            .then(() => console.log('Wishlist synced (IDs only)'))
            .catch(err => console.error('Error syncing wishlist', err));
    }
}
