import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { PriceService } from '../../services/price.service';
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
  priceService = inject(PriceService);
  authService = inject(AuthService);
  router = inject(Router);

  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  isMobileFilterOpen = false;

  get isOwner(): boolean {
    return this.authService.currentUser()?.role === 'owner';
  }

  navigateToAddProduct() {
    this.router.navigate(['/admin/product/new']);
  }

  ngOnInit() {
    this.productService.getProducts().subscribe(products => {
      // Calculate prices for all products
      this.allProducts = products.map(product => {
        const priceDetails = this.priceService.calculatePrice(product);
        return { ...product, price: priceDetails.finalPrice };
      });
      this.filteredProducts = this.allProducts;
    });
  }

  onFilterChange(filters: any) {
    this.filteredProducts = this.allProducts.filter(product => {
      const matchesSearch = !filters.search || product.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCategory = !filters.category || product.category === filters.category;
      const matchesMetalType = !filters.metalType || (product.metalType && product.metalType.includes(filters.metalType));
      const matchesPrice = product.price <= filters.priceRange;

      // Weight Filter
      const matchesWeight = !filters.weightRanges || filters.weightRanges.length === 0 ||
        filters.weightRanges.some((range: any) => product.weight >= range.min && product.weight <= range.max);

      // Purity Filter
      const matchesPurity = !filters.purities || filters.purities.length === 0 ||
        filters.purities.includes(product.purity);

      return matchesSearch && matchesCategory && matchesPrice && matchesMetalType && matchesWeight && matchesPurity;
    });
  }
}
