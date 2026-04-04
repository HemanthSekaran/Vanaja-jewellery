import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BlogService, BlogPost } from '../../services/blog.service';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './blog-detail.html',
  styleUrl: './blog-detail.css'
})
export class BlogDetail implements OnInit {
  private blogService = inject(BlogService);
  private route = inject(ActivatedRoute);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  post?: BlogPost;
  categoryCounts = computed(() => this.blogService.getCategoryCounts());

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.blogService.getPostBySlug(slug).subscribe(post => {
        this.post = post;
        if (post) {
          this.updateMeta(post);
        }
      });
    }
  }

  get categoryEntries() {
    return Object.entries(this.categoryCounts());
  }

  updateMeta(post: BlogPost): void {
    this.titleService.setTitle(`${post.title} | Sri Anbu Jewellery`);
    this.metaService.updateTag({ name: 'description', content: post.excerpt });
    this.metaService.updateTag({ name: 'author', content: post.author });
    this.metaService.updateTag({ property: 'og:title', content: post.title });
    this.metaService.updateTag({ property: 'og:description', content: post.excerpt });
    this.metaService.updateTag({ property: 'og:image', content: post.image });
  }
}

