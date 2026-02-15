import { Component, Input, signal, OnInit, OnDestroy, OnChanges, SimpleChanges, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface CarouselItem {
  id: string;
  image: string;
  subtitle: string;
  title: string;
  description: string;
  link: string | any[];
  queryParams?: any;
  buttonText: string;
  price?: number;
}

@Component({
  selector: 'app-collection-carousel',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="py-20 bg-background">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl md:text-4xl font-bold text-center mb-4 font-serif text-primary">{{ title }}</h2>
        <p class="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          {{ subtitle }}
        </p>
        
        <div class="relative max-w-6xl mx-auto">
          @if (items().length > 0) {
            <div class="overflow-hidden rounded-lg shadow-2xl bg-card border border-border">
              <div class="flex flex-col md:flex-row h-[500px]">
                <!-- Image Section -->
                 <div class="md:w-1/2 md:shrink-0 relative h-full bg-white flex items-center justify-center p-8">
                  <img [src]="currentItem().image" [alt]="currentItem().title" 
                       class="max-w-full max-h-full transition-opacity duration-500 hover:scale-105 transform transition-transform"
                       [class.object-cover]="!currentItem().price" 
                       [class.object-contain]="!!currentItem().price"
                       [class.absolute]="!currentItem().price"
                       [class.inset-0]="!currentItem().price"
                       [class.w-full]="!currentItem().price"
                       [class.!h-full]="!currentItem().price">
                </div>
                
                <!-- Content Section -->
                <div class="md:w-1/2 md:shrink-0 p-12 flex flex-col justify-center items-start bg-card relative">
                  <span class="text-secondary uppercase tracking-widest text-sm font-bold mb-4">{{ currentItem().subtitle }}</span>
                  <h3 class="text-4xl font-serif font-bold mb-6 text-card-foreground">{{ currentItem().title }}</h3>
                  
                  @if (currentItem().price) {
                    <div class="text-2xl font-bold text-primary mb-6">₹{{ currentItem().price | number:'1.0-0' }}</div>
                  }

                  <p class="text-muted-foreground mb-8 text-lg leading-relaxed line-clamp-3">{{ currentItem().description }}</p>
                  
                  <a [routerLink]="currentItem().link" [queryParams]="currentItem().queryParams" class="inline-flex items-center justify-center bg-secondary text-secondary-foreground px-8 py-3 rounded-none uppercase tracking-widest text-sm font-medium hover:bg-secondary/90 transition-colors">
                    {{ currentItem().buttonText }}
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
              @for (item of items(); track item.id; let i = $index) {
                <button (click)="currentIndex.set(i)" class="w-2 h-2 rounded-full transition-colors" [class.bg-primary]="i === currentIndex()" [class.bg-muted-foreground]="i !== currentIndex()"></button>
              }
            </div>
          } @else {
             <div class="text-center py-12 text-muted-foreground">
              Loading...
            </div>
          }
        </div>
      </div>
    </section>
  `
})
export class CollectionCarousel implements OnInit, OnDestroy, OnChanges {
  @Input() collections: any[] = [];
  @Input('items') inputItems: CarouselItem[] = [];
  @Input() title: string = 'Featured Collections';
  @Input() subtitle: string = 'Discover our curated collections, each telling a unique story of luxury and craftsmanship.';

  items = signal<CarouselItem[]>([]);
  currentIndex = signal(0);
  currentItem = computed(() => this.items()[this.currentIndex()] || {} as CarouselItem);

  private intervalId: any;

  ngOnInit() {
    this.startAutoSlide();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['collections'] && this.collections && this.collections.length > 0) {
      const mappedItems = this.collections.map(c => ({
        id: c.id,
        image: c.image,
        subtitle: 'Collection',
        title: c.name,
        description: c.description,
        link: '/products',
        queryParams: { category: c.id },
        buttonText: 'View Collection'
      }));
      this.items.set(mappedItems);
    }

    if (changes['inputItems'] && this.inputItems) {
      this.items.set(this.inputItems);
    }
  }

  ngOnDestroy() {
    this.stopAutoSlide();
  }

  startAutoSlide() {
    // Only start if we have multiple items, but we should also restart if items change.
    // However, simple logic for now:
    if (this.intervalId) clearInterval(this.intervalId);

    this.intervalId = setInterval(() => {
      this.next();
    }, 5000);
  }

  stopAutoSlide() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  next() {
    if (this.items().length === 0) return;
    this.currentIndex.update(i => (i + 1) % this.items().length);
  }

  prev() {
    if (this.items().length === 0) return;
    this.currentIndex.update(i => (i - 1 + this.items().length) % this.items().length);
  }
}
