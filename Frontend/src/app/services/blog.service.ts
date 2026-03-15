import { Injectable } from '@angular/core';
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

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private posts: BlogPost[] = [
    {
      id: '1',
      title: 'The Timeless Elegance of Gold Jewelry',
      excerpt: 'Discover why gold remains the ultimate symbol of luxury and sophistication in the world of jewelry.',
      content: 'Gold has been prized for its beauty and rarity for millennia. From ancient civilizations to modern fashion runways, gold jewelry has stood the test of time. In this post, we explore the different carats of gold, its cultural significance, and how to style gold pieces for any occasion...',
      author: 'Vanaja',
      date: '2024-03-10',
      image: '/images/blog/gold-jewelry.png',
      category: 'Education',
      slug: 'timeless-elegance-gold-jewelry'
    },
    {
      id: '2',
      title: 'How to Choose the Perfect Engagement Ring',
      excerpt: 'A comprehensive guide to selecting a ring that perfectly captures your unique love story.',
      content: 'Choosing an engagement ring is one of the most significant jewelry purchases you will ever make. It is not just about the diamond; it is about the setting, the metal, and most importantly, the person wearing it. We break down the 4Cs of diamonds and help you navigate the world of engagement rings...',
      author: 'Hemanth',
      date: '2024-03-05',
      image: '/images/blog/engagement-ring.png',
      category: 'Guides',
      slug: 'perfect-engagement-ring-guide'
    },
    {
      id: '3',
      title: 'Spring 2024 Jewelry Trends to Watch',
      excerpt: 'From statement pearls to colorful gemstones, here are the trends that will define the upcoming season.',
      content: 'As we move into Spring 2024, the jewelry world is embracing bold designs and vibrant colors. Statement necklaces are making a comeback, and mixing metals is no longer a fashion faux pas. Learn how to incorporate these fresh trends into your everyday look...',
      author: 'Vanaja',
      date: '2024-02-28',
      image: '/images/blog/spring-trends.png',
      category: 'Trends',
      slug: 'spring-2024-jewelry-trends'
    }
  ];

  constructor() { }

  getPosts(): Observable<BlogPost[]> {
    return of(this.posts);
  }

  getPostBySlug(slug: string): Observable<BlogPost | undefined> {
    const post = this.posts.find(p => p.slug === slug);
    return of(post);
  }

  getRecentPosts(limit: number = 3): Observable<BlogPost[]> {
    return of(this.posts.slice(0, limit));
  }
}
