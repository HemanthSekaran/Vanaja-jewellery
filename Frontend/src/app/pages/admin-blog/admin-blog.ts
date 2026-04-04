import { Component, inject, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BlogService, BlogPost } from '../../services/blog.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-blog',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-blog.html',
  styleUrl: './admin-blog.css'
})
export class AdminBlogList {
  private blogService = inject(BlogService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Plain array driven by effect() — guaranteed Zone.js change detection
  posts: BlogPost[] = [];
  deleteConfirmId: string | null = null;

  constructor() {
    effect(() => {
      this.posts = this.blogService.posts();
      this.cdr.markForCheck();
    });
  }

  confirmDelete(id: string) {
    this.deleteConfirmId = id;
  }

  cancelDelete() {
    this.deleteConfirmId = null;
  }

  deletePost(id: string) {
    this.blogService.deletePost(id);
    this.toastService.show('Blog post deleted', 'success');
    this.deleteConfirmId = null;
  }

  editPost(id: string) {
    this.router.navigate(['/admin/blog/edit', id]);
  }
}
