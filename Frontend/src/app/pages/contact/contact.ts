import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  imports: [FormsModule],
  template: `
    <div class="container mx-auto px-4 py-16 max-w-4xl">
      <h1 class="text-4xl font-bold mb-8 text-center">Contact Us</h1>
      
      <div class="grid md:grid-cols-2 gap-12">
        <div>
          <h2 class="text-2xl font-bold mb-6">Get in Touch</h2>
          <p class="text-muted-foreground mb-8">
            Have a question about our collections or need assistance? We're here to help.
          </p>
          
          <div class="space-y-6">
            <div class="flex items-start space-x-4">
              <div class="bg-primary/10 p-3 rounded-full text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div>
                <h3 class="font-semibold">Visit Us</h3>
                <p class="text-muted-foreground">131 ,Subbarya Chetty street<br>Thirupapuliyur Cuddalore Tamil Nadu 607002</p>
              </div>
            </div>

            <div class="flex items-start space-x-4">
              <div class="bg-primary/10 p-3 rounded-full text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <div>
                <h3 class="font-semibold">Email Us</h3>
                <p class="text-muted-foreground">srivanajajewellery@gmail.com</p>
              </div>
            </div>

            <div class="flex items-start space-x-4">
              <div class="bg-primary/10 p-3 rounded-full text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-phone"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div>
                <h3 class="font-semibold">Call Us</h3>
                <p class="text-muted-foreground">8220822776 / 8220374776</p>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-muted/30 p-8 rounded-lg">
          <form class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label for="firstName" class="text-sm font-medium">First name</label>
                <input id="firstName" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="John">
              </div>
              <div class="space-y-2">
                <label for="lastName" class="text-sm font-medium">Last name</label>
                <input id="lastName" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Doe">
              </div>
            </div>
            <div class="space-y-2">
              <label for="email" class="text-sm font-medium">Email</label>
              <input id="email" type="email" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="john@example.com">
            </div>
            <div class="space-y-2">
              <label for="message" class="text-sm font-medium">Message</label>
              <textarea id="message" class="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="How can we help you?"></textarea>
            </div>
            <button type="submit" class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  `
})
export class Contact { }
