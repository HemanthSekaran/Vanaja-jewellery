import { Component, Input, inject } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { PriceService } from '../../services/price.service';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';
import { RouterLink, Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css'
})
export class ProductCard {
  @Input() product!: Product;
  cartService = inject(CartService);
  wishlistService = inject(WishlistService);
  priceService = inject(PriceService);
  authService = inject(AuthService);
  productService = inject(ProductService);
  router = inject(Router);

  isAdded = false;

  get isOwner(): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'owner';
  }

  deleteProduct(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(this.product.id).subscribe(() => {
        window.location.reload(); // Simple reload to refresh list for now
      });
    }
  }

  editProduct(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.router.navigate(['/admin/product/edit', this.product.id]);
  }

  addToCart(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    if (this.product.variants && this.product.variants.length > 0) {
      const variant = this.product.variants[0];

      // Calculate price if missing
      if (this.product.price === 0 || variant.price === 0) {
        const priceDetails = this.priceService.calculatePrice(this.product);
        if (this.product.price === 0) this.product.price = priceDetails.finalPrice;
        if (variant.price === 0) variant.price = priceDetails.finalPrice;
      }

      this.cartService.addToCart(this.product, variant);
      this.isAdded = true;
      setTimeout(() => this.isAdded = false, 2000);
    }
  }

  toggleWishlist(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    if (this.isInWishlist) {
      this.wishlistService.removeFromWishlist(this.product.id);
    } else {
      this.wishlistService.addToWishlist(this.product);
    }
  }

  get isInWishlist() {
    return this.wishlistService.isInWishlist(this.product.id);
  }

  isNew(dateString: string): boolean {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 90; // Considered new if less than 90 days old
  }
}
