import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BlogPost } from '../../services/blog.service';

@Component({
  selector: 'app-blog-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './blog-card.html',
  styleUrl: './blog-card.css'
})
export class BlogCardComponent {
  @Input({ required: true }) post!: BlogPost;
}
