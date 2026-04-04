import { Component, signal, viewChild, ElementRef, effect, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

interface ChatMessage {
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

interface QuickReply {
  question: string;
  answer: string;
  followUp?: QuickReply[];
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact.html',
  styles: [`
    :host { display: block; }
    .animate-in {
      animation: slideIn 0.4s ease-out forwards;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class Contact implements AfterViewInit {
  scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  messages = signal<ChatMessage[]>([
    {
      text: "Hi! Welcome to Sri Anbu Jewellery. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);

  // Main menu used as the root of all conversations
  private mainMenu: QuickReply[] = [
    {
      question: "What are your showroom timings?",
      answer: "We are open every day from 10:00 AM to 8:30 PM. Would you like to check our holiday schedule or location?",
      followUp: [
        { question: "Check Sunday timings", answer: "We are open on Sundays with the same timings: 10:00 AM to 8:30 PM." },
        { question: "Get store location", answer: "We are at 131, Subbarya Chetty street, Cuddalore. See the map on the left!" },
        { question: "Main Menu", answer: "Sure, let's go back. What else can I help you with?" }
      ]
    },
    {
      question: "Do you offer home delivery?",
      answer: "Yes, we ship all over India. Your order is safe and insured. Do you need details on charges or safety?",
      followUp: [
        { question: "What are the shipping charges?", answer: "We offer free shipping on all orders above ₹10,000 across India." },
        { question: "How safe is the delivery?", answer: "We use high-security transit insurance and tamper-proof packaging for every piece." },
        { question: "Main Menu", answer: "Sure, how else can I assist you?" }
      ]
    },
    {
      question: "Can I get a custom design?",
      answer: "Absolutely! We can make custom jewelry based on your vision. What kind of design are you looking for?",
      followUp: [
        { question: "Gold Jewelry Customization", answer: "Our goldsmiths can create anything from traditional necklaces to modern rings. Send us a photo or sketch!" },
        { question: "Diamond Jewelry Customization", answer: "We offer certified diamonds and custom settings to make your rings or earrings truly unique." },
        { question: "Book Consultation", answer: "I can arrange a call with our design expert. Please provide your phone number in the chat." },
        { question: "Main Menu", answer: "No problem. Feel free to ask about our existing collections too!" }
      ]
    },
    {
      question: "How to track my order?",
      answer: "Tracking is easy! You can find it in the app or ask me about specific phases.",
      followUp: [
        { question: "Check in 'My Orders'", answer: "Go to your Profile and click 'My Orders' to see the live status of your purchase." },
        { question: "What does 'Processing' mean?", answer: "Processing means our artisans are currently crafting or hallmarking your jewelry." },
        { question: "Main Menu", answer: "Back to home. Do you have any other questions?" }
      ]
    },
    {
      question: "Speak with a jewelry expert",
      answer: "Our experts are available for virtual consultations. How would you like to connect?",
      followUp: [
        { question: "WhatsApp the expert", answer: "Click the WhatsApp button on the left to start a direct chat with our lead designer." },
        { question: "Request a callback", answer: "Noted! Our team will call you on your registered number within 2 working hours." },
        { question: "Main Menu", answer: "Alright. Let's explore our timings or delivery options instead." }
      ]
    }
  ];

  currentReplies = signal<QuickReply[]>(this.mainMenu);
  isTyping = signal(false);

  constructor() {
    effect(() => {
      this.messages();
      this.isTyping();
      this.scrollToBottom();
    });
  }

  ngAfterViewInit() {
    this.initMap();
  }

  private initMap() {
    const lat = 11.747282888783749;
    const lng = 79.75259458901265;

    const map = L.map('map').setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    L.marker([lat, lng], { icon }).addTo(map)
      .bindPopup('Sri Anbu Jewellery')
      .openPopup();
  }

  handleReply(reply: QuickReply) {
    if (this.isTyping()) return;

    this.messages.update(prev => [...prev, {
      text: reply.question,
      sender: 'user',
      timestamp: new Date()
    }]);

    this.isTyping.set(true);

    setTimeout(() => {
      this.isTyping.set(false);
      this.messages.update(prev => [...prev, {
        text: reply.answer,
        sender: 'bot',
        timestamp: new Date()
      }]);

      // Update the options for the NEXT step
      if (reply.followUp && reply.followUp.length > 0) {
        this.currentReplies.set(reply.followUp);
      } else {
        // If it's a leaf node or "Main Menu", go back to the start
        this.currentReplies.set(this.mainMenu);
      }
    }, 800);
  }

  private scrollToBottom() {
    const el = this.scrollContainer()?.nativeElement;
    if (el) {
      setTimeout(() => {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: 'smooth'
        });
      }, 50);
    }
  }
}
