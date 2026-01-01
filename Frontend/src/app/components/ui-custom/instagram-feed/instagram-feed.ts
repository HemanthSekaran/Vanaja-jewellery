import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-instagram-feed',
  imports: [CommonModule],
  template: `
    <section class="py-16 px-4">
      <div class="container mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold mb-2">@SriVanajaJewellery</h2>
          <p class="text-muted-foreground">Follow us on Instagram for daily inspiration</p>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          @for (item of feedItems; track item) {
            <div class="aspect-square bg-gray-100 rounded-md overflow-hidden relative group cursor-pointer">
              <div class="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                 <!-- Placeholder -->
                 <span class="text-xs">Instagram Post</span>
              </div>
              <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `
})
export class InstagramFeed {
  feedItems = [1, 2, 3, 4];
}
