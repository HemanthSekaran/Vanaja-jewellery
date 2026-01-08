import { Component, OnInit, inject } from '@angular/core';
import { HeroSection } from '../../components/hero-section/hero-section';
import { ProductCard } from '../../components/product-card/product-card';
import { CollectionCarousel } from '../../components/ui-custom/collection-carousel/collection-carousel';
import { BrandStory } from '../../components/ui-custom/brand-story/brand-story';
import { NewsletterSection } from '../../components/ui-custom/newsletter-section/newsletter-section';
import { InstagramFeed } from '../../components/ui-custom/instagram-feed/instagram-feed';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { CommonModule } from '@angular/common';

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
  bestSellers: Product[] = [];
  featuredProducts: Product[] = [];
  featuredCollections: any[] = [];

  isLoadingBestSellers = true;
  isLoadingFeatured = true;

  ngOnInit() {
    this.productService.getTopSellingProducts({ limit: 4 }).subscribe({
      next: (response) => {
        this.bestSellers = response.products;
        this.isLoadingBestSellers = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoadingBestSellers = false;
      }
    });

    this.productService.getFeaturedProducts({ limit: 4 }).subscribe({
      next: (response) => {
        this.featuredProducts = response.products;
        this.isLoadingFeatured = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoadingFeatured = false;
      }
    });

    this.productService.getFeaturedCollections().subscribe(collections => {
      this.featuredCollections = collections;
    });
  }
}
