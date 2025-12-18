import { Injectable, signal, computed } from '@angular/core';
import { Product, CartItem, ProductVariant } from '../models/product.model';

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private cartItems = signal<CartItem[]>([]);

    public readonly items = computed(() => this.cartItems());
    public readonly count = computed(() => this.cartItems().reduce((acc, item) => acc + item.quantity, 0));
    public readonly total = computed(() => this.cartItems().reduce((acc, item) => acc + (item.variant.price * item.quantity), 0));

    constructor() {
        try {
            const saved = localStorage.getItem('cart');
            if (saved) {
                const items = JSON.parse(saved);
                this.cartItems.set(Array.isArray(items) ? items.filter(i => i.product && i.variant) : []);
            }
        } catch (e) {
            console.error('Error loading cart from localStorage', e);
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

            this.saveToStorage(newItems);
            return newItems;
        });
    }

    removeFromCart(productId: string, variantId: string) {
        this.cartItems.update(items => {
            const newItems = items.filter(item =>
                !(item.product.id === productId && item.variant.id === variantId)
            );
            this.saveToStorage(newItems);
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

            this.saveToStorage(newItems);
            return newItems;
        });
    }

    private saveToStorage(items: CartItem[]) {
        try {
            localStorage.setItem('cart', JSON.stringify(items));
        } catch (e) {
            console.error('Error saving cart to localStorage', e);
        }
    }

    isInCart(productId: string, variantId?: string): boolean {
        return this.cartItems().some(item =>
            item?.product?.id === productId &&
            (!variantId || item?.variant?.id === variantId)
        );
    }
}
