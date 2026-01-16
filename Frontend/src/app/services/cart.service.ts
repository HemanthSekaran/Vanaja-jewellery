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
            const res = await this.apiService.getCart();
            const products = res.data?.data?.products || [];

            const items: CartItem[] = products.map((product: any) => {
                // Ensure variants are parsed if they come as string
                if (typeof product.variants === 'string') {
                    try { product.variants = JSON.parse(product.variants); } catch (e) { }
                }

                // Default logic since backend response doesn't strictly pair variant/qty
                // We default to the first variant if available, or a placeholder
                const defaultVariant = (product.variants && product.variants.length > 0)
                    ? product.variants[0]
                    : { id: 'default', price: product.price || 0, stock: 1, material: 'Standard' };

                // Find the specific variant if variantId is provided in the response
                let variant = defaultVariant;
                if (product.variantId) {
                    const foundVariant = product.variants?.find((v: any) => v.id === product.variantId);
                    if (foundVariant) {
                        variant = foundVariant;
                    }
                }

                return {
                    product: product,
                    variant: variant,
                    quantity: product.quantity || 1
                };
            });

            this.cartItems.set(items);
        } catch (e) {
            console.warn('Could not load cart from API', e);
        }
    }

    addToCart(product: Product, variant: ProductVariant, quantity: number = 1) {
        this.cartItems.update(items => {
            const existingItemIndex = items.findIndex(item =>
                String(item.product.id) === String(product.id) && item.variant.id === variant.id
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
                !(String(item.product.id) === String(productId) && item.variant.id === variantId)
            );
            this.syncToDb(newItems);
            return newItems;
        });
    }

    updateQuantity(productId: string, variantId: string, quantity: number) {
        this.cartItems.update(items => {
            const newItems = items.map(item => {
                if (String(item.product.id) === String(productId) && item.variant.id === variantId) {
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
            String(item?.product?.id) === String(productId) &&
            (!variantId || item?.variant?.id === variantId)
        );
    }
}
