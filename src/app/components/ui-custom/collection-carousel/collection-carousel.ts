import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-collection-carousel',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="py-20 bg-background">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl md:text-4xl font-bold text-center mb-4 font-serif text-primary">Featured Collections</h2>
        <p class="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Discover our curated collections, each telling a unique story of luxury and craftsmanship.
        </p>
        
        <div class="relative max-w-6xl mx-auto">
          <div class="overflow-hidden rounded-lg shadow-2xl bg-card border border-border">
            <div class="flex flex-col md:flex-row h-[600px]">
              <!-- Image Section -->
              <div class="md:w-1/2 md:shrink-0 relative h-full">
                <img [src]="currentCollection.image" [alt]="currentCollection.name" class="absolute inset-0 w-full !h-full object-cover transition-opacity duration-500">
              </div>
              
              <!-- Content Section -->
              <div class="md:w-1/2 md:shrink-0 p-12 flex flex-col justify-center items-start bg-card relative">
                <span class="text-secondary uppercase tracking-widest text-sm font-bold mb-4">Collection</span>
                <h3 class="text-4xl font-serif font-bold mb-6 text-card-foreground">{{ currentCollection.name }}</h3>
                <p class="text-muted-foreground mb-8 text-lg leading-relaxed">{{ currentCollection.description }}</p>
                <a routerLink="/products" [queryParams]="{category: currentCollection.id}" class="inline-flex items-center justify-center bg-secondary text-secondary-foreground px-8 py-3 rounded-none uppercase tracking-widest text-sm font-medium hover:bg-secondary/90 transition-colors">
                  View Collection
                </a>

                <!-- Navigation -->
                <div class="absolute bottom-8 right-8 flex space-x-2">
                  <button (click)="prev()" class="p-2 border border-border hover:bg-muted transition-colors rounded-full text-muted-foreground hover:text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <button (click)="next()" class="p-2 border border-border hover:bg-muted transition-colors rounded-full text-muted-foreground hover:text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Dots -->
          <div class="flex justify-center mt-8 space-x-2">
            @for (collection of collections; track collection.id; let i = $index) {
              <button (click)="currentIndex.set(i)" class="w-2 h-2 rounded-full transition-colors" [class.bg-primary]="i === currentIndex()" [class.bg-muted-foreground]="i !== currentIndex()"></button>
            }
          </div>
        </div>
      </div>
    </section>
  `
})
export class CollectionCarousel {
  @Input() collections: any[] = [];
  currentIndex = signal(0);

  get currentCollection() {
    return this.collections[this.currentIndex()] || {};
  }

  next() {
    this.currentIndex.update(i => (i + 1) % this.collections.length);
  }

  prev() {
    this.currentIndex.update(i => (i - 1 + this.collections.length) % this.collections.length);
  }
}
