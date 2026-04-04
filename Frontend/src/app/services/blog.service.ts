import { Injectable, signal, computed, effect } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  image: string;
  category: string;
  slug: string;
}

const STORAGE_KEY = 'vanaja_blog_posts_v2';

const DEFAULT_POSTS: BlogPost[] = [
  {
    id: 'default-1',
    title: 'The Timeless Elegance of Gold Jewelry',
    excerpt: 'Discover why gold remains the ultimate symbol of luxury and sophistication in the world of jewelry.',
    content: `Gold has been prized for its beauty and rarity for millennia. From ancient civilizations to modern fashion runways, gold jewelry has stood the test of time. In this post, we explore the different carats of gold, its cultural significance, and how to style gold pieces for any occasion.

Beyond its aesthetic appeal, gold is an incredibly durable metal that doesn't tarnish or corrode over time. This makes it an excellent choice for heirloom pieces that can be passed down through generations. Whether it is a simple wedding band or an intricate necklace, gold maintains its value and luster, serving as both a beautiful accessory and a stable investment.

To keep your gold jewelry looking its best, regular maintenance is key. A gentle cleaning with warm water and mild soap can remove everyday oils and dust. For more intricate designs, a soft-bristled brush can help reach those difficult spots. Professional polishing every few years can also restore that brand-new shine, ensuring your pieces remain as breathtaking as the day you first wore them.`,
    author: 'Vanaja',
    date: '2024-03-10',
    image: '/images/blog/gold-jewelry.png',
    category: 'Education',
    slug: 'blog-1'
  },
  {
    id: 'default-2',
    title: 'How to Choose the Perfect Engagement Ring',
    excerpt: 'A comprehensive guide to selecting a ring that perfectly captures your unique love story.',
    content: `Choosing an engagement ring is one of the most significant jewelry purchases you will ever make. It is not just about the diamond; it is about the setting, the metal, and most importantly, the person wearing it. We break down the 4Cs of diamonds and help you navigate the world of engagement rings.

The choice of metal plays a crucial role in the overall look and durability of the ring. While platinum offers unmatched strength and a naturally white sheen, yellow gold provides a classic, warm glow that never goes out of style. White gold and rose gold have also gained immense popularity, offering modern alternatives that can complement different skin tones and personal styles perfectly.

Finding the right ring size is equally important to ensure comfort and security. You can discreetly borrow one of your partner's existing rings or consult with a professional jeweler for an accurate measurement. Remember that the band's width and the setting's height can also affect how the ring feels on the finger, so consider your partner's lifestyle and daily activities when making your final decision.`,
    author: 'Hemanth',
    date: '2024-03-05',
    image: '/images/blog/engagement-ring.png',
    category: 'Guides',
    slug: 'blog-2'
  },
  {
    id: 'default-3',
    title: 'Spring 2024 Jewelry Trends to Watch',
    excerpt: 'From statement pearls to colorful gemstones, here are the trends that will define the upcoming season.',
    content: `As we move into Spring 2024, the jewelry world is embracing bold designs and vibrant colors. Statement necklaces are making a comeback, and mixing metals is no longer a fashion faux pas. Learn how to incorporate these fresh trends into your everyday look.

Sustainability is becoming a core focus this season, with more designers opting for ethically sourced gemstones and recycled metals. Lab-grown diamonds and repurposed vintage pieces are appearing in high-fashion collections, proving that luxury and responsibility can go hand in hand. This shift towards conscious consumption allows you to wear your favorite pieces with pride and purpose.

Layering remains a dominant trend, allowing for a highly personalized and creative expression of style. Don't be afraid to mix different lengths of necklaces or stack rings of varying textures. Combining delicate chains with chunky pendants creates a dynamic look that can easily transition from day to night. The key is to find a balance that reflects your unique personality while staying on-trend.`,
    author: 'Vanaja',
    date: '2024-02-28',
    image: '/images/blog/spring-trends.png',
    category: 'Trends',
    slug: 'blog-3'
  }
];

@Injectable({
  providedIn: 'root'
})
export class BlogService {

  private _postsSignal = signal<BlogPost[]>([]);

  /** Public read-only computed signal */
  readonly posts = computed(() => this._postsSignal());

  constructor() {
    // Load from localStorage (or use defaults if first visit)
    const initialPosts = this.loadFromStorage();
    this._postsSignal.set(initialPosts);

    // Auto-save to localStorage whenever posts change
    effect(() => {
      const current = this._postsSignal();
      this.saveToStorage(current);
    });
  }

  // ── Storage helpers ───────────────────────────────────────────────────────

  private loadFromStorage(): BlogPost[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: BlogPost[] = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { /* ignore */ }
    return [...DEFAULT_POSTS];
  }

  private saveToStorage(posts: BlogPost[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch { /* ignore quota errors */ }
  }

  // ── Public read methods ───────────────────────────────────────────────────

  getPosts(): Observable<BlogPost[]> {
    return of(this._postsSignal());
  }

  getPostBySlug(slug: string): Observable<BlogPost | undefined> {
    return of(this._postsSignal().find(p => p.slug === slug));
  }

  getRecentPosts(limit: number = 3): Observable<BlogPost[]> {
    return of(this._postsSignal().slice(0, limit));
  }

  getPostById(id: string): BlogPost | undefined {
    return this._postsSignal().find(p => p.id === id);
  }

  getCategoryCounts(): { [key: string]: number } {
    return this._postsSignal().reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  // ── Admin CRUD ────────────────────────────────────────────────────────────

  createPost(data: Omit<BlogPost, 'id' | 'slug' | 'date'>): BlogPost {
    const nextNum = this.nextNumber();
    const post: BlogPost = {
      ...data,
      id: `post-${crypto.randomUUID()}`,
      slug: `blog-${nextNum}`,
      date: new Date().toISOString().split('T')[0]
    };
    this._postsSignal.update(posts => [post, ...posts]);
    return post;
  }

  updatePost(id: string, data: Omit<BlogPost, 'id' | 'slug' | 'date'>): void {
    this._postsSignal.update(posts =>
      posts.map(p => p.id === id ? { ...p, ...data } : p)
    );
  }

  deletePost(id: string): void {
    this._postsSignal.update(posts => posts.filter(p => p.id !== id));
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private nextNumber(): number {
    const nums = this._postsSignal().map(p => {
      const m = p.slug.match(/^blog-(\d+)$/);
      return m ? parseInt(m[1], 10) : 0;
    });
    return Math.max(0, ...nums) + 1;
  }
}
