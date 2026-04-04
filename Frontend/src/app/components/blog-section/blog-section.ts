import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { BlogCardComponent } from '../blog-card/blog-card';

@Component({
  selector: 'app-blog-section',
  standalone: true,
  imports: [CommonModule, RouterModule, BlogCardComponent],
  templateUrl: './blog-section.html',
  styleUrl: './blog-section.css'
})
export class BlogSectionComponent {
  private blogService = inject(BlogService);
  recentPosts = computed(() => this.blogService.posts().slice(0, 3));
}
