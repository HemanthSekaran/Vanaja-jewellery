import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';

import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-cart',
    imports: [CommonModule, RouterLink],
    templateUrl: './cart.html',
    styleUrl: './cart.css'
})
export class Cart {
    cartService = inject(CartService);

    getImageUrl(image: string): string {
        if (!image) return 'https://via.placeholder.com/400x400?text=No+Image';
        if (image.startsWith('http')) return image;
        return `${environment.imageBaseUrl}${image}`;
    }

    updateQuantity(productId: string, variantId: string, quantity: number) {
        this.cartService.updateQuantity(productId, variantId, quantity);
    }

    removeItem(productId: string, variantId: string) {
        this.cartService.removeFromCart(productId, variantId);
    }
}
