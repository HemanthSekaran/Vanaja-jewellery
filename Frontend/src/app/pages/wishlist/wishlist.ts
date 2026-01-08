import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WishlistService } from '../../services/wishlist.service';
import { ProductCard } from '../../components/product-card/product-card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-wishlist',
  imports: [CommonModule, ProductCard, RouterLink],
  templateUrl: './wishlist.html'
})
export class Wishlist {
  wishlistService = inject(WishlistService);
}
