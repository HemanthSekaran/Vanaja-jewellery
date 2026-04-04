import { Component, OnInit, inject, ChangeDetectorRef, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { HeroSection } from '../../components/hero-section/hero-section';
import { ProductCard } from '../../components/product-card/product-card';
import { CollectionCarousel } from '../../components/ui-custom/collection-carousel/collection-carousel';
import { BrandStory } from '../../components/ui-custom/brand-story/brand-story';
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
    InstagramFeed
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, OnDestroy {
  @ViewChild('bestSellersScroll') bestSellersScroll!: ElementRef;
  @ViewChild('featuredScroll') featuredScroll!: ElementRef;

  productService = inject(ProductService);
  apiService = inject(ApiService);
  cdr = inject(ChangeDetectorRef);
  bestSellers: Product[] = [];
  featuredProducts: Product[] = [];
  featuredCollections: any[] = [];

  isLoadingBestSellers = true;
  isLoadingFeatured = true;

  private scrollInterval: any;

  ngOnInit() {
    this.startAutoScroll();
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

  ngOnDestroy() {
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
    }
  }

  private startAutoScroll() {
    this.stopAutoScroll();
    this.scrollInterval = setInterval(() => {
      this.rotateForward('best', true);
      this.rotateForward('featured', true);
    }, 5000);
  }

  private stopAutoScroll() {
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }
  }

  rotateForward(type: 'best' | 'featured', isAuto: boolean = false) {
    if (!isAuto) this.startAutoScroll(); // Restart timer on manual interaction

    if (type === 'best' && this.bestSellers.length > 0) {
      const container = this.bestSellersScroll.nativeElement;
      this.performRotation(container, () => {
        this.bestSellers = [...this.bestSellers.slice(1), this.bestSellers[0]];
      });
    } else if (type === 'featured' && this.featuredProducts.length > 0) {
      const container = this.featuredScroll.nativeElement;
      this.performRotation(container, () => {
        this.featuredProducts = [...this.featuredProducts.slice(1), this.featuredProducts[0]];
      });
    }
  }

  rotateBackward(type: 'best' | 'featured') {
    this.startAutoScroll(); // Restart timer on manual interaction

    if (type === 'best' && this.bestSellers.length > 0) {
      const container = this.bestSellersScroll.nativeElement;
      this.bestSellers = [this.bestSellers[this.bestSellers.length - 1], ...this.bestSellers.slice(0, -1)];
      this.cdr.detectChanges();
    } else if (type === 'featured' && this.featuredProducts.length > 0) {
      const container = this.featuredScroll.nativeElement;
      this.featuredProducts = [this.featuredProducts[this.featuredProducts.length - 1], ...this.featuredProducts.slice(0, -1)];
      this.cdr.detectChanges();
    }
  }

  private performRotation(container: HTMLElement, updateArray: () => void) {
    const firstItem = container.firstElementChild as HTMLElement;
    if (!firstItem) return;

    const itemWidth = firstItem.offsetWidth;
    const gap = 24;
    const scrollStep = itemWidth + gap;

    container.scrollBy({ left: scrollStep, behavior: 'smooth' });

    setTimeout(() => {
      updateArray();
      container.scrollTo({ left: 0, behavior: 'auto' });
      this.cdr.detectChanges();
    }, 600); // Slightly shorter for snappier feel
  }
}
