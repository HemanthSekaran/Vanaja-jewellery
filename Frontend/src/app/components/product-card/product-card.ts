import { Component, Input, inject, computed } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product.model';
import { RouterLink, Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';
import { ToastService } from '../../services/toast.service';
import { AlertService } from '../../services/alert.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css'
})
export class ProductCard {
  @Input() product!: Product;
  @Input() showWishlistButton = true;
  cartService = inject(CartService);
  wishlistService = inject(WishlistService);
  authService = inject(AuthService);
  productService = inject(ProductService);
  router = inject(Router);
  toastService = inject(ToastService);
  alertService = inject(AlertService);

  isAdded = false;

  isAdmin = computed(() => {
    // Primary: Read from sessionStorage for immediate availability
    try {
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Handle both wrapped and direct formats
        const userData = parsedUser.user || parsedUser;
        const role = userData?.role;
        return role === 'admin';
      }
    } catch (e) {
      // Silent fail
    }

    // Fallback: Try signal
    const user = this.authService.currentUser();
    if (user) {
      return user.role === 'admin';
    }

    return false;
  });

  getImageUrl(image: string): string {
    if (!image) return 'https://via.placeholder.com/400x400?text=No+Image';
    if (image.startsWith('http')) return image;
    return `${environment.imageBaseUrl}${image}`;
  }

  async toggleFeatured(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    if (!this.isAdmin()) return;

    // Optimistic Update
    const originalValue = this.product.featured;
    const newValue = !originalValue;
    this.product.featured = newValue;

    const payload = { featured: newValue ? 1 : 0 };

    try {
      await this.productService.updateProductStatus(this.product.id, payload).toPromise();
      this.toastService.show(`Product ${newValue ? 'marked as' : 'removed from'} Featured`, 'success');
    } catch (error) {
      // Revert on failure
      this.product.featured = originalValue;
      this.toastService.show('Failed to update featured status', 'error');
    }
  }

  async toggleTopSelling(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    if (!this.isAdmin()) return;

    // Optimistic Update
    const originalValue = this.product.bestseller;
    const newValue = !originalValue;
    this.product.bestseller = newValue;

    const payload = { top_selling: newValue ? 1 : 0 };

    try {
      await this.productService.updateProductStatus(this.product.id, payload).toPromise();
      this.toastService.show(`Product ${newValue ? 'marked as' : 'removed from'} Best Selling`, 'success');
    } catch (error) {
      // Revert on failure
      this.product.bestseller = originalValue;
      this.toastService.show('Failed to update best selling status', 'error');
    }
  }

  async deleteProduct(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    const confirmed = await this.alertService.confirm(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      'Delete',
      'Cancel'
    );

    if (confirmed) {
      this.productService.deleteProduct(this.product.id).subscribe({
        next: () => {
          this.toastService.show('Product deleted successfully', 'success');
          // Optional: wait a bit or just reload
          window.location.reload();
        },
        error: () => {
          this.toastService.show('Failed to delete product', 'error');
        }
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

  get isInCart() {
    return this.cartService.isInCart(this.product.id);
  }

  isNew(dateString: string): boolean {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 90; // Considered new if less than 90 days old
  }
}
