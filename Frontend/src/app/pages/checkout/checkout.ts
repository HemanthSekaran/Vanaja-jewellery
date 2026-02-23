import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ApiService } from '../../services/api.service';
import { AlertService } from '../../services/alert.service';
import { CartItem } from '../../models/product.model';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-checkout',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './checkout.html',
})
export class Checkout implements OnInit {
    cartService = inject(CartService);
    apiService = inject(ApiService);
    alertService = inject(AlertService);
    route = inject(ActivatedRoute);
    router = inject(Router);

    items = signal<CartItem[]>([]);
    total = signal<number>(0);
    loading = signal<boolean>(true);
    processing = signal<boolean>(false);
    isDirectBuy = signal<boolean>(false);

    calculatedBreakdown = computed(() => {
        const items = this.items();
        let metalValue = 0;
        let wastageValue = 0;
        let basePrice = 0;
        let gstAmount = 0;
        let finalPrice = 0;

        items.forEach(item => {
            const qty = item.quantity;
            const calc = item.product.priceCalculation;
            if (calc) {
                metalValue += (calc.metalValue || 0) * qty;
                wastageValue += (calc.wastageValue || 0) * qty;
                basePrice += (calc.basePrice || 0) * qty;
                gstAmount += (calc.gstAmount || 0) * qty;
                finalPrice += (calc.finalPrice || 0) * qty;
            } else {
                const price = item.variant.price * qty;
                basePrice += price;
                finalPrice += price;
            }
        });

        return {
            metalValue,
            wastageValue,
            basePrice,
            gstAmount,
            finalPrice
        };
    });

    ngOnInit() {
        this.route.queryParams.subscribe(async (params) => {
            const productId = params['productId'];
            const quantity = Number(params['quantity']) || 1;

            if (productId) {
                this.isDirectBuy.set(true);
                await this.loadDirectItem(productId, quantity);
            } else {
                this.items.set(this.cartService.items());
                this.total.set(this.cartService.total());
                this.loading.set(false);
            }
        });
    }

    async loadDirectItem(productId: string, quantity: number) {
        try {
            const res = await this.apiService.getProductById(productId);
            const product = res.data.data.product;

            // Construct a temporary CartItem
            const variant = (product.variants && product.variants.length > 0)
                ? product.variants[0]
                : { id: 'default', price: 0, stock: 1, material: 'Standard' };

            // Use backend calculated price if available
            if (product.priceCalculation && product.priceCalculation.finalPrice) {
                variant.price = product.priceCalculation.finalPrice;
            } else {
                variant.price = product.price || 0;
            }

            const item: CartItem = {
                product,
                variant,
                quantity
            };

            this.items.set([item]);
            this.total.set(variant.price * quantity);
        } catch (err: any) {
            console.error('Failed to load product', err);
            // Handle error, maybe redirect back
        } finally {
            this.loading.set(false);
        }
    }

    getImageUrl(image: string | undefined): string {
        if (!image) return 'https://via.placeholder.com/400x400?text=No+Image';
        if (image.startsWith('http')) return image;
        return `${environment.imageBaseUrl}${image}`;
    }

    async placeOrder() {
        if (this.processing()) return;
        this.processing.set(true);

        try {
            let result;
            if (this.isDirectBuy()) {
                // For direct buy, valid cart service is not used, so we call checkout logic manually
                // But to reuse logic, we can expose a helper or just duplicate the flat mapping
                const productIds: number[] = [];
                this.items().forEach(item => {
                    for (let i = 0; i < item.quantity; i++) {
                        productIds.push(Number(item.product.id));
                    }
                });
                result = await this.apiService.createOrder({ productIds });
            } else {
                // Cart checkout
                result = await this.cartService.checkout();
            }

            // Redirect to success or home
            // Ideally show a success message first
            await this.alertService.success(
                'Order Placed!',
                'Your order placed successfully and our representative will contact you shortly. Thank you!'
            );
            this.router.navigate(['/']);

        } catch (err: any) {
            console.error('Order failed', err);
            await this.alertService.error(
                'Order Failed',
                'Failed to place order. Please try again.'
            );
        } finally {
            this.processing.set(false);
        }
    }
}
