import { Component, inject, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { LayoutService } from '../../services/layout.service';
import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';
import { MetalPriceBanner } from '../metal-price-banner/metal-price-banner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MetalPriceBanner, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  cartService = inject(CartService);
  wishlistService = inject(WishlistService);
  layoutService = inject(LayoutService);
  authService = inject(AuthService);
  productService = inject(ProductService);
  router = inject(Router);

  isUserMenuOpen = false;
  categories: string[] = [];

  ngOnInit() {
    this.productService.getFilterOptions().subscribe(options => {
      this.categories = options.categories || [];
    });
  }

  toggleMenu() {
    this.layoutService.toggleMobileMenu();
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  logout() {
    this.authService.logout();
    this.isUserMenuOpen = false;
  }

  get userName(): string {
    const user = this.authService.currentUser();
    if (!user) return '';
    return user.name || (user as any).user?.name || '';
  }

  get userEmail(): string {
    const user = this.authService.currentUser();
    if (!user) return '';
    return user.email || (user as any).user?.email || '';
  }

  get customizationLink(): string {
    const user = this.authService.currentUser();
    return user?.role === 'admin' ? '/customization/list' : '/customization';
  }

  get isHomePage(): boolean {
    return this.router.url === '/';
  }
}
