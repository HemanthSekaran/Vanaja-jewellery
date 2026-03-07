import { Component, OnInit, inject, ChangeDetectorRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { ProductCard } from '../../components/product-card/product-card';
import { ProductFilters } from '../../components/product-filters/product-filters';

import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, ProductCard, ProductFilters],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export class ProductList implements OnInit {
  productService = inject(ProductService);
  authService = inject(AuthService);
  router = inject(Router);
  cd = inject(ChangeDetectorRef);

  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  isMobileFilterOpen = false;

  activeFilters: { type: string, value: string, label: string }[] = [];

  // Pagination state
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 12;

  // Filter state
  currentFilters: any = {};

  // Loading and error states
  loading = false;
  error: string | null = null;

  // Make Math available in template
  Math = Math;

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

  navigateToAddProduct() {
    this.router.navigate(['/admin/product/new']);
  }

  ngOnInit() {
    this.loadProducts();
  }

  onFilterChange(filters: any) {
    this.currentFilters = filters;
    this.updateActiveFilters();
    this.currentPage = 1; // Reset to first page when filters change
    this.loadProducts();
  }

  updateActiveFilters() {
    this.activeFilters = [];

    if (this.currentFilters.categories) {
      this.currentFilters.categories.forEach((v: string) =>
        this.activeFilters.push({ type: 'category', value: v, label: v }));
    }
    if (this.currentFilters.metals) {
      this.currentFilters.metals.forEach((v: string) =>
        this.activeFilters.push({ type: 'metal', value: v, label: v }));
    }
    if (this.currentFilters.purities) {
      this.currentFilters.purities.forEach((v: string) =>
        this.activeFilters.push({ type: 'purity', value: v, label: v }));
    }
    if (this.currentFilters.weightRanges) {
      this.currentFilters.weightRanges.forEach((v: string) =>
        this.activeFilters.push({ type: 'weight', value: v, label: `Weight: ${v}` }));
    }
    if (this.currentFilters.search) {
      this.activeFilters.push({ type: 'search', value: this.currentFilters.search, label: `"${this.currentFilters.search}"` });
    }
  }

  removeFilter(filter: any) {
    // This is tricky because we need to update the child component's state
    // For now, we'll just implement the logic to clear it in currentFilters
    // and we'll need a way to notify the child.

    if (filter.type === 'search') {
      this.currentFilters.search = '';
    } else if (filter.type === 'category') {
      this.currentFilters.categories = this.currentFilters.categories.filter((v: string) => v !== filter.value);
    } else if (filter.type === 'metal') {
      this.currentFilters.metals = this.currentFilters.metals.filter((v: string) => v !== filter.value);
    } else if (filter.type === 'purity') {
      this.currentFilters.purities = this.currentFilters.purities.filter((v: string) => v !== filter.value);
    } else if (filter.type === 'weight') {
      this.currentFilters.weightRanges = this.currentFilters.weightRanges.filter((v: string) => v !== filter.value);
    }

    this.updateActiveFilters();
    this.loadProducts();

    // Trigger child update - we'll add a signal for this
    this.filtersResetTrigger = Date.now();
  }

  filtersResetTrigger = 0;

  loadProducts() {
    this.loading = true;
    this.error = null;

    const params: any = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      ...this.currentFilters
    };

    console.log('📦 Loading products with params:', params);

    this.productService.getProducts(params).subscribe({
      next: (response) => {
        console.log('✅ Product list received response:', response);
        this.filteredProducts = response.products;
        this.allProducts = response.products;
        this.currentPage = response.pagination.currentPage;
        this.totalPages = response.pagination.totalPages;
        this.totalItems = response.pagination.totalItems;
        this.itemsPerPage = response.pagination.itemsPerPage;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading products:', err);
        this.error = 'Failed to load products. Please try again.';
        this.loading = false;
      }
    });
  }

  // Pagination methods
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadProducts();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadProducts();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadProducts();
    }
  }

  clearAllFilters() {
    this.currentFilters = {};
    this.activeFilters = [];
    this.filtersResetTrigger = Date.now();
    this.loadProducts();
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    if (this.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, this.currentPage - 2);
      const endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }
}
