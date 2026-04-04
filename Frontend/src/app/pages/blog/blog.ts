import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { BlogCardComponent } from '../../components/blog-card/blog-card';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterModule, BlogCardComponent],
  templateUrl: './blog.html',
  styleUrl: './blog.css'
})
export class BlogList {
  private blogService = inject(BlogService);
  private authService = inject(AuthService);
  blogPosts = this.blogService.posts;
  isAdmin = computed(() => this.authService.currentUser()?.role === 'admin');

  deletePost(id: string) {
    if (confirm('Are you sure you want to delete this blog post?')) {
      this.blogService.deletePost(id);
    }
  }
}
