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
  featuredCollections: any[] = [];

  ngOnInit() {
    this.productService.getProducts({ limit: 100 }).subscribe(response => {
      this.bestSellers = response.products.filter((p: Product) => p.bestseller);
    });
    this.productService.getFeaturedCollections().subscribe(collections => {
      this.featuredCollections = collections;
    });
  }
}
