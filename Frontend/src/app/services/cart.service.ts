import { Injectable, signal, computed, inject } from '@angular/core';
import { Product, CartItem, ProductVariant } from '../models/product.model';
import { ApiService } from './api.service';
import { ProductService } from './product.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private apiService = inject(ApiService);
    private productService = inject(ProductService);
    private cartItems = signal<CartItem[]>([]);

    public readonly items = computed(() => this.cartItems());
    public readonly count = computed(() => this.cartItems().reduce((acc, item) => acc + item.quantity, 0));
    public readonly total = computed(() => this.cartItems().reduce((acc, item) => acc + (item.variant.price * item.quantity), 0));

    constructor() {
        this.loadInitialCart();
    }

    private async loadInitialCart() {
        try {
            const res = await this.apiService.getProfile();
            if (!res.data?.user) return;

            let rawItems = res.data.user.add_to_cart || res.data.user.cart;

            if (typeof rawItems === 'string') {
                try { rawItems = JSON.parse(rawItems); } catch (e) { rawItems = []; }
            }

            if (!Array.isArray(rawItems)) return;

            const hydratedItems: CartItem[] = [];

            for (const item of rawItems) {
                // Scenario 1: Legacy Full Object
                if (item.product && item.product.id) {
                    hydratedItems.push(item);
                }
                // Scenario 2: New ID-only Storage
                else if (item.productId) {
                    try {
                        const product = await firstValueFrom(this.productService.getProductById(item.productId));
                        if (product) {
                            // Find specific variant or default to first
                            const variant = product.variants.find(v => v.id === item.variantId) || product.variants[0];
                            hydratedItems.push({
                                product,
                                variant,
                                quantity: item.quantity || 1
                            });
                        }
                    } catch (err) {
                        console.error(`Failed to hydrate product ${item.productId}`, err);
                    }
                }
            }

            this.cartItems.set(hydratedItems);

        } catch (e) {
            console.warn('Could not load cart from API', e);
        }
    }

    addToCart(product: Product, variant: ProductVariant, quantity: number = 1) {
        this.cartItems.update(items => {
            const existingItemIndex = items.findIndex(item =>
                item.product.id === product.id && item.variant.id === variant.id
            );

            let newItems;
            if (existingItemIndex > -1) {
                newItems = [...items];
                newItems[existingItemIndex].quantity += quantity;
            } else {
                newItems = [...items, { product, variant, quantity }];
            }

            this.syncToDb(newItems);
            return newItems;
        });
    }

    removeFromCart(productId: string, variantId: string) {
        this.cartItems.update(items => {
            const newItems = items.filter(item =>
                !(item.product.id === productId && item.variant.id === variantId)
            );
            this.syncToDb(newItems);
            return newItems;
        });
    }

    updateQuantity(productId: string, variantId: string, quantity: number) {
        this.cartItems.update(items => {
            const newItems = items.map(item => {
                if (item.product.id === productId && item.variant.id === variantId) {
                    return { ...item, quantity: Math.max(0, quantity) };
                }
                return item;
            }).filter(item => item.quantity > 0);

            this.syncToDb(newItems);
            return newItems;
        });
    }

    private syncToDb(items: CartItem[]) {
        // Map to strictly minimal structure: { productId, variantId, quantity }
        // User requested "only productId", but we MUST keep quantity to be a valid cart
        const minimalItems = items.map(item => ({
            productId: item.product.id,
            variantId: item.variant.id,
            quantity: item.quantity
        }));

        this.apiService.updateProfile({ add_to_cart: minimalItems })
            .then(() => console.log('Cart synced to DB (IDs only)'))
            .catch(err => console.error('Error syncing cart to DB', err));
    }

    isInCart(productId: string, variantId?: string): boolean {
        return this.cartItems().some(item =>
            item?.product?.id === productId &&
            (!variantId || item?.variant?.id === variantId)
        );
    }
}
