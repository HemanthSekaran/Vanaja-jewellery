import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { PriceService, PriceBreakdown } from '../../services/price.service';
import { Product, ProductVariant } from '../../models/product.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-details',
  imports: [CommonModule, FormsModule],
  templateUrl: './product-details.html'
})
export class ProductDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  private priceService = inject(PriceService);

  product: Product | undefined;
  selectedImage: string = '';
  selectedVariant: ProductVariant | undefined;
  priceDetails: PriceBreakdown | undefined;

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.productService.getProductById(id).subscribe(product => {
        if (product) {
          this.product = product;
          this.selectedImage = product.images[0];
          if (product.variants.length > 0) {
            this.selectedVariant = product.variants[0];
          }
          this.calculatePrice();
        }
      });
    });
  }

  calculatePrice() {
    if (this.product) {
      this.priceDetails = this.priceService.calculatePrice(this.product);
      // Update product display price
      this.product.price = this.priceDetails.finalPrice;
    }
  }

  get hasSizes() {
    return this.product?.variants.some(v => v.size);
  }

  get hasMaterials() {
    return this.product?.materials && this.product.materials.length > 0;
  }

  get sizeVariants() {
    return this.product?.variants.filter(v => v.size) || [];
  }

  selectVariant(variant: ProductVariant) {
    this.selectedVariant = variant;
  }

  showAddedMessage = false;

  toggleCart() {
    console.log('Toggle Cart called', { product: this.product, variant: this.selectedVariant, isInCart: this.isInCart });
    if (this.product && this.selectedVariant) {
      // Ensure variant has the correct calculated price
      if (this.priceDetails) {
        this.selectedVariant.price = this.priceDetails.finalPrice;
      }

      if (this.isInCart) {
        this.cartService.removeFromCart(this.product.id, this.selectedVariant.id);
      } else {
        this.cartService.addToCart(this.product, this.selectedVariant);
        this.showAddedMessage = true;
        setTimeout(() => this.showAddedMessage = false, 3000);
      }
    } else {
      console.warn('Cannot toggle cart: Product or Variant missing');
    }
  }

  get isInCart() {
    return this.product && this.selectedVariant ?
      this.cartService.isInCart(this.product.id, this.selectedVariant.id) : false;
  }

  toggleWishlist() {
    console.log('Toggle Wishlist called');
    if (this.product) {
      if (this.isInWishlist) {
        this.wishlistService.removeFromWishlist(this.product.id);
      } else {
        this.wishlistService.addToWishlist(this.product);
      }
    }
  }

  get isInWishlist() {
    return this.product ? this.wishlistService.isInWishlist(this.product.id) : false;
  }
}
