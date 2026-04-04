import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BlogService, BlogPost } from '../../services/blog.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-blog-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-blog-form.html',
  styleUrl: './admin-blog-form.css'
})
export class AdminBlogForm implements OnInit {
  private blogService = inject(BlogService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditMode = false;
  editId: string | null = null;
  isSubmitting = false;

  form: Omit<BlogPost, 'id' | 'slug' | 'date'> = {
    title: '',
    excerpt: '',
    content: '',
    author: '',
    image: '',
    category: ''
  };

  imagePreview: string = '';

  readonly categories = ['Education', 'Guides', 'Trends', 'Care & Maintenance', 'Collections', 'Culture'];

  ngOnInit(): void {
    this.editId = this.route.snapshot.paramMap.get('id');
    if (this.editId) {
      const post = this.blogService.getPostById(this.editId);
      if (post) {
        this.isEditMode = true;
        this.form = {
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          author: post.author,
          image: post.image,
          category: post.category
        };
        this.imagePreview = post.image;
      } else {
        this.toastService.show('Post not found', 'error');
        this.router.navigate(['/admin/blog']);
      }
    }
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      this.form.image = result;
      this.imagePreview = result;
    };
    reader.readAsDataURL(file);
  }

  clearImage(): void {
    this.form.image = '';
    this.imagePreview = '';
  }

  onSubmit(): void {
    if (!this.form.title.trim() || !this.form.excerpt.trim() || !this.form.content.trim() ||
        !this.form.author.trim() || !this.form.category) {
      this.toastService.show('Please fill all required fields', 'error');
      return;
    }

    if (this.isSubmitting) return;
    this.isSubmitting = true;

    if (this.isEditMode && this.editId) {
      this.blogService.updatePost(this.editId, this.form);
      this.toastService.show('Post updated successfully', 'success');
    } else {
      this.blogService.createPost(this.form);
      this.toastService.show('Post created successfully', 'success');
    }

    this.router.navigate(['/admin/blog']);
    this.isSubmitting = false;
  }

  cancel(): void {
    this.router.navigate(['/admin/blog']);
  }
}
