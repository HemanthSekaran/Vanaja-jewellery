import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { LayoutService } from '../../services/layout.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  cartService = inject(CartService);
  wishlistService = inject(WishlistService);
  layoutService = inject(LayoutService);
  authService = inject(AuthService);

  isUserMenuOpen = false;

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
}
