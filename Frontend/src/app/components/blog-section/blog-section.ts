import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BlogService, BlogPost } from '../../services/blog.service';
import { BlogCardComponent } from '../blog-card/blog-card';

@Component({
  selector: 'app-blog-section',
  standalone: true,
  imports: [CommonModule, RouterModule, BlogCardComponent],
  templateUrl: './blog-section.html',
  styleUrl: './blog-section.css'
})
export class BlogSectionComponent implements OnInit {
  recentPosts: BlogPost[] = [];

  constructor(private blogService: BlogService) {}

  ngOnInit(): void {
    this.blogService.getRecentPosts(3).subscribe(posts => {
      this.recentPosts = posts;
    });
  }
}
