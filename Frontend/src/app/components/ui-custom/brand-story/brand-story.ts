import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-brand-story',
  imports: [RouterLink],
  template: `
    <section class="py-20 bg-gray-50">
      <div class="container mx-auto px-4">
        <div class="grid lg:grid-cols-2 gap-16 items-center">
          <!-- Text Content -->
          <div class="space-y-8">
            <h2 class="text-3xl md:text-4xl font-bold font-serif text-gray-900">Our Story</h2>
            <div class="w-20 h-1 bg-primary"></div>
            <p class="text-lg text-gray-600 leading-relaxed">
              Founded in 2010, Sri Vanaja Jewellery started with a simple mission: to make luxury accessible. 
              We believe that every piece of jewelry tells a story, a memory, a moment in time.
            </p>
            <p class="text-lg text-gray-600 leading-relaxed">
              From our humble beginnings in a small workshop to becoming a beloved brand worldwide, 
              our commitment to quality, craftsmanship, and ethical sourcing has never wavered. 
              Each gemstone is carefully selected, and every design is thoughtfully crafted to bring joy to our customers.
            </p>
            <p class="text-lg text-gray-600 leading-relaxed">
              As we continue to grow, our core values remain the same: integrity, innovation, and an unwavering 
              commitment to our customers. We invite you to be part of our story and create your own legacy with our 
              timeless pieces.
            </p>
            <a routerLink="/about" class="inline-block bg-[#C0A080] text-white px-8 py-3 rounded-none uppercase tracking-widest text-sm font-medium hover:bg-[#A08060] transition-colors shadow-md">
              Learn More About Us
            </a>
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-2 gap-6">
            <div class="bg-white p-8 rounded-lg shadow-sm text-center transform hover:-translate-y-1 transition-transform duration-300">
              <div class="text-4xl font-bold text-primary mb-2 font-serif">14k+</div>
              <div class="text-sm text-gray-500 uppercase tracking-wider font-medium">Happy Customers</div>
            </div>
            <div class="bg-white p-8 rounded-lg shadow-sm text-center transform hover:-translate-y-1 transition-transform duration-300">
              <div class="text-4xl font-bold text-primary mb-2 font-serif">50k+</div>
              <div class="text-sm text-gray-500 uppercase tracking-wider font-medium">Items Sold</div>
            </div>
            <div class="bg-white p-8 rounded-lg shadow-sm text-center transform hover:-translate-y-1 transition-transform duration-300">
              <div class="text-4xl font-bold text-primary mb-2 font-serif">100%</div>
              <div class="text-sm text-gray-500 uppercase tracking-wider font-medium">Handcrafted</div>
            </div>
            <div class="bg-white p-8 rounded-lg shadow-sm text-center transform hover:-translate-y-1 transition-transform duration-300">
              <div class="text-4xl font-bold text-primary mb-2 font-serif">24/7</div>
              <div class="text-sm text-gray-500 uppercase tracking-wider font-medium">Customer Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class BrandStory {

}
