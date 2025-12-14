import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { LayoutService } from '../../services/layout.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ReactiveFormsModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  cartService = inject(CartService);
  wishlistService = inject(WishlistService);
  layoutService = inject(LayoutService);
  authService = inject(AuthService);
  apiService = inject(ApiService);
  fb = inject(FormBuilder);

  isUserMenuOpen = false;
  isEditing = false;
  editProfileForm!: FormGroup;

  toggleMenu() {
    this.layoutService.toggleMobileMenu();
  }

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    if (!this.isUserMenuOpen) {
      this.isEditing = false;
    }
  }

  logout() {
    this.authService.logout();
    this.isUserMenuOpen = false;
  }

  startEditing() {
    const user = this.authService.currentUser();
    if (user) {
      this.editProfileForm = this.fb.group({
        name: [user.name, Validators.required],
        email: [{ value: user.email, disabled: true }],
        phone: [user.phone || ''],
        address: [user.address || '']
      });
      this.isEditing = true;
    }
  }

  cancelEditing() {
    this.isEditing = false;
  }

  async saveProfile() {
    if (this.editProfileForm.valid) {
      try {
        const updatedData = this.editProfileForm.getRawValue();
        await this.apiService.updateProfile(updatedData);

        const profileResponse = await this.apiService.getProfile();
        let userData = profileResponse.data;
        if (userData && userData.data) {
          userData = userData.data;
        }

        this.authService.currentUser.set(userData);
        sessionStorage.setItem('user', JSON.stringify(userData));

        this.isEditing = false;
      } catch (error) {
        console.error('Failed to update profile', error);
        alert('Failed to update profile');
      }
    }
  }
}
