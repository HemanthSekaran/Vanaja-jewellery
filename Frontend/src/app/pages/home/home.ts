import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { HeroSection } from '../../components/hero-section/hero-section';
import { ProductCard } from '../../components/product-card/product-card';
import { CollectionCarousel } from '../../components/ui-custom/collection-carousel/collection-carousel';
import { BrandStory } from '../../components/ui-custom/brand-story/brand-story';
import { NewsletterSection } from '../../components/ui-custom/newsletter-section/newsletter-section';
import { InstagramFeed } from '../../components/ui-custom/instagram-feed/instagram-feed';
import { ProductService, PaginatedProductResponse } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { CommonModule } from '@angular/common';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    HeroSection,
    ProductCard,
    CollectionCarousel,
    BrandStory,
    NewsletterSection,
    InstagramFeed
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  productService = inject(ProductService);
  apiService = inject(ApiService);
  cdr = inject(ChangeDetectorRef);
  bestSellers: Product[] = [];
  featuredProducts: Product[] = [];
  featuredCollections: any[] = [];

  isLoadingBestSellers = true;
  isLoadingFeatured = true;

  ngOnInit() {
    this.getTopSellingProducts({ limit: 20 }).subscribe({
      next: (response) => {
        console.log('Home: Top Selling Loaded', response);
        this.bestSellers = response.products;
        this.isLoadingBestSellers = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Home: Top Selling Error', err);
        this.isLoadingBestSellers = false;
        this.cdr.detectChanges();
      }
    });

    this.getFeaturedProducts({ limit: 20 }).subscribe({
      next: (response) => {
        console.log('Home: Featured Loaded', response);
        this.featuredProducts = response.products;
        this.isLoadingFeatured = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Home: Featured Error', err);
        this.isLoadingFeatured = false;
        this.cdr.detectChanges();
      }
    });

    this.productService.getFeaturedCollections().subscribe(collections => {
      this.featuredCollections = collections;
      this.cdr.detectChanges();
    });
  }

  getTopSellingProducts(params?: any): Observable<PaginatedProductResponse> {
    return from(this.apiService.getTopSellingProducts(params)).pipe(
      map((response: any) => this.productService.processProductResponse(response, params)),
      catchError(error => {
        console.error('Error fetching best sellers:', error);
        return of(this.productService.getEmptyResponse());
      })
    );
  }

  getFeaturedProducts(params?: any): Observable<PaginatedProductResponse> {
    return from(this.apiService.getFeaturedProducts(params)).pipe(
      map((response: any) => this.productService.processProductResponse(response, params)),
      catchError(error => {
        console.error('Error fetching featured products:', error);
        return of(this.productService.getEmptyResponse());
      })
    );
  }
}
