import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-newsletter-section',
  imports: [FormsModule],
  template: `
    <section class="py-20 bg-[#C0A080] text-white relative overflow-hidden">
      <!-- Decorative Icon Background -->
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/></svg>
      </div>

      <div class="container mx-auto max-w-3xl text-center relative z-10 px-4">
        <div class="inline-block p-4 rounded-full bg-white/20 mb-6 backdrop-blur-sm">
           <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        </div>
        
        <h2 class="text-3xl md:text-4xl font-bold mb-4 font-serif">Exclusive Offers & Updates</h2>
        <p class="text-white/90 mb-10 text-lg">
          Subscribe to our newsletter and receive 10% off your first order. Be the first to know about new collections, exclusive offers, and jewelry care tips.
        </p>
        
        <form (ngSubmit)="onSubmit()" class="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
          <input 
            type="email" 
            [(ngModel)]="email" 
            name="email"
            placeholder="Enter your email address" 
            class="flex h-12 w-full rounded-none border-0 bg-white/90 px-4 py-2 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-white focus:outline-none"
            required
          >
          <button type="submit" class="bg-gray-900 text-white px-8 py-3 h-12 font-medium uppercase tracking-wider hover:bg-gray-800 transition-colors whitespace-nowrap">
            Subscribe
          </button>
        </form>
        
        <p class="text-xs text-white/70 mt-4">
          By subscribing, you agree to our Privacy Policy and Terms of Service.
        </p>

        @if (subscribed) {
          <div class="absolute top-0 left-0 right-0 p-4 bg-green-500 text-white animate-in slide-in-from-top">
            Thank you for subscribing! Check your email for your discount code.
          </div>
        }
      </div>
    </section>
  `
})
export class NewsletterSection {
  email = '';
  subscribed = false;

  onSubmit() {
    if (this.email) {
      this.subscribed = true;
      this.email = '';
      setTimeout(() => this.subscribed = false, 5000);
    }
  }
}
