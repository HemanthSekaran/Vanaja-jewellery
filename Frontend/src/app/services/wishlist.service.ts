import { Injectable, signal, computed } from '@angular/core';
import { Product, WishlistItem } from '../models/product.model';

@Injectable({
    providedIn: 'root'
})
export class WishlistService {
    private wishlistItems = signal<WishlistItem[]>([]);

    public readonly items = computed(() => this.wishlistItems());
    public readonly count = computed(() => this.wishlistItems().length);

    constructor() {
        // Load from local storage if needed
        const saved = localStorage.getItem('wishlist');
        if (saved) {
            this.wishlistItems.set(JSON.parse(saved));
        }
    }

    addToWishlist(product: Product) {
        this.wishlistItems.update(items => {
            if (items.some(item => item.product.id === product.id)) {
                return items;
            }
            const newItems = [...items, { product, addedAt: new Date().toISOString() }];
            this.saveToStorage(newItems);
            return newItems;
        });
    }

    removeFromWishlist(productId: string) {
        this.wishlistItems.update(items => {
            const newItems = items.filter(item => item.product.id !== productId);
            this.saveToStorage(newItems);
            return newItems;
        });
    }

    isInWishlist(productId: string): boolean {
        return this.wishlistItems().some(item => item.product.id === productId);
    }

    private saveToStorage(items: WishlistItem[]) {
        localStorage.setItem('wishlist', JSON.stringify(items));
    }
}
