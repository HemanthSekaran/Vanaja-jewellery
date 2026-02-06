import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { ToastService } from '../../services/toast.service';
import { ApiService } from '../../services/api.service';
import { Product } from '../../models/product.model';
import { Wastage } from '../admin/wastage/wastage';

@Component({
  selector: 'app-admin-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container py-10 max-w-2xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-serif font-bold">{{ isEditMode ? 'Edit Product' : 'Add New Product' }}</h1>
      </div>

      <form (ngSubmit)="onSubmit()" class="space-y-6">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Product Name *</label>
            <input type="text" [(ngModel)]="product.name" name="name" required
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Category *</label>
            <select [(ngModel)]="product.category" name="category" required (ngModelChange)="onCategoryChange()"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="" disabled>Select Category</option>
              <option *ngFor="let option of wastageOptions" [ngValue]="option.waste_id">
                {{ option.jewel_type }}
              </option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Grams (Weight) *</label>
            <input type="number" [(ngModel)]="product.weight" name="weight" required step="0.01"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          </div>
          <!-- Wastage Input Removed as per request -->
          <div class="space-y-2 hidden">
            <label class="text-sm font-medium">Wastage (%) *</label>
            <input type="number" [(ngModel)]="product.wastage" name="wastage" required step="0.01" readonly
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 opacity-50">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Metal *</label>
            <select [(ngModel)]="product.metal" name="metal" required (ngModelChange)="onMetalChange()"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="">Select Metal</option>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Metal Purity *</label>
            <select [(ngModel)]="product.metal_purity" name="metal_purity" required [disabled]="!product.metal"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <option value="">Select Purity</option>
              @if (product.metal === 'Gold') {
                <option [value]="24">24K</option>
                <option [value]="22">22K</option>
                <option [value]="18">18K</option>
              }
              @if (product.metal === 'Silver') {
                <option [value]="925">925 (Sterling Silver)</option>
                <option [value]="999">999 (Fine Silver)</option>
              }
            </select>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Availability</label>
          <select [(ngModel)]="product.availability" name="availability"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <option value="YES">In Stock</option>
            <option value="NO">Out of Stock</option>
          </select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Description</label>
          <textarea [(ngModel)]="product.description" name="description" rows="3"
            class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"></textarea>
        </div>

         <div class="space-y-4">
            <label class="text-sm font-medium">Product Images</label>
            
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4" *ngIf="product.images.length > 0">
                <div *ngFor="let image of product.images; let i = index" class="relative group border rounded-lg bg-card overflow-hidden">
                    <div class="aspect-square relative bg-muted">
                        <img [src]="image" class="w-full h-full object-cover">
                        <button type="button" (click)="removeImage(i)" class="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors" title="Remove image">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    </div>
                    <div class="p-2">
                        <p class="text-xs font-medium truncate" [title]="imageDetails[i]?.name">{{ imageDetails[i]?.name || 'Image ' + (i + 1) }}</p>
                        <p class="text-xs text-muted-foreground">{{ imageDetails[i]?.size || 'Unknown' }}</p>
                    </div>
                </div>
            </div>

            <div class="border-2 border-dashed border-input rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer relative"
                 (dragover)="onDragOver($event)" (drop)="onDrop($event)">
                <input type="file" (change)="onFileSelected($event)" accept="image/*" multiple class="absolute inset-0 opacity-0 cursor-pointer z-10">
                <div class="mb-4 text-muted-foreground/50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
                        <path d="M12 12v9"/>
                        <path d="m16 16-4-4-4 4"/>
                    </svg>
                </div>
                <h3 class="text-lg font-medium mb-1">Click to upload or drag and drop</h3>
                <p class="text-xs text-muted-foreground">PNG, JPG or GIF (Multiple images supported)</p>
            </div>
          </div>

        <div class="flex justify-end gap-4 pt-4">
          <button type="button" (click)="cancel()" class="px-4 py-2 border rounded-md hover:bg-accent hover:text-accent-foreground">Cancel</button>
          <button type="submit" class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            {{ isEditMode ? 'Update Product' : 'Create Product' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class AdminProduct implements OnInit {
  productService = inject(ProductService);
  toastService = inject(ToastService);
  apiService = inject(ApiService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  product: Product = this.getEmptyProduct();
  isEditMode = false;

  imageDetails: { name: string, size: string }[] = [];
  selectedImageFiles: File[] = [];
  wastageOptions: any[] = []; // Using any to avoid importing Wastage interface if complex, or import it.

  cdr = inject(ChangeDetectorRef);

  async ngOnInit() {
    await this.loadWastageOptions(); // Ensure options are loaded first
    const id = this.route.snapshot.paramMap.get('id');
    console.log('AdminProduct: Init with ID:', id);
    if (id) {
      this.isEditMode = true;
      this.productService.getProductById(id).subscribe({
        next: (p) => {
          console.log('AdminProduct: Received product from service:', p);
          if (p) {
            // Update properties in place to preserve object reference for ngModel
            Object.assign(this.product, p);

            // Log the product after assignment
            console.log('AdminProduct: Assigned to this.product (in-place):', this.product);

            // Ensure wastage is set correctly if not present or just to be safe
            // This also validates that the category exists in the options
            // Ensure matching is case-insensitive to handle 'RINGS' vs 'Rings'
            // Try matching by waste_id first (if mapped correctly) OR by jewel_type (legacy/fallback)
            const selectedOption = this.wastageOptions.find(w =>
              w.waste_id == this.product.category ||
              w.jewel_type?.toLowerCase() === this.product.category?.toString().toLowerCase()
            );
            if (selectedOption) {
              console.log(`AdminProduct: Matched category ${this.product.category} with wastage option. Wastage: ${selectedOption.wastage}`);
              // Fix: Map the category name string to the waste_id for the select input
              this.product.category = selectedOption.waste_id;
              // Sync wastage
              this.product.wastage = parseFloat(selectedOption.wastage);
            } else {
              console.warn(`AdminProduct: Product category '${this.product.category}' not found in wastage options:`, this.wastageOptions);
            }

            if (p.imageMetadata) {
              this.imageDetails = [...p.imageMetadata];
            } else {
              // Fallback for existing products without metadata
              this.imageDetails = this.product.images.map((_, i) => ({
                name: `Image ${i + 1}`,
                size: 'Unknown'
              }));
            }

            // Force change detection
            this.cdr.detectChanges();
          } else {
            console.error('AdminProduct: Received undefined product');
          }
        },
        error: (err) => console.error('AdminProduct: Error fetching product:', err)
      });
    }
  }

  getEmptyProduct(): Product {
    return {
      id: crypto.randomUUID(),
      name: '',
      price: 0,
      images: [],
      imageMetadata: [],
      description: '',
      category: '',
      materials: [],
      metalType: [],
      purity: '22K',
      makingCharges: 0,
      wastagePercentage: 0,
      variants: [],
      featured: false,
      bestseller: false,
      rating: 0,
      reviewCount: 0,
      inStock: true,
      createdAt: new Date().toISOString().split('T')[0],
      // Backend fields
      weight: 0,
      wastage: 0,
      availability: 'YES'
    };
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(files);
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      this.handleFiles(files);
    }
  }

  handleFiles(files: FileList) {
    // Process all selected files
    Array.from(files).forEach(file => {
      // Only process image files
      if (!file.type.startsWith('image/')) {
        return;
      }

      this.selectedImageFiles.push(file);

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.product.images.push(e.target.result);
        this.imageDetails.push({
          name: file.name,
          size: this.formatFileSize(file.size)
        });
      };
      reader.readAsDataURL(file);
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  removeImage(index: number) {
    this.product.images.splice(index, 1);
    this.imageDetails.splice(index, 1);
    this.selectedImageFiles.splice(index, 1);
  }

  onMetalChange() {
    // Reset purity when metal type changes
    this.product.metal_purity = undefined;
  }

  async loadWastageOptions() {
    try {
      console.log("AdminProduct: Loading wastage options...");
      const response = await this.apiService.getWastages();
      console.log("AdminProduct: Raw response:", response);

      let data = response.data;
      if (data && data.data && data.data.wastages) {
        this.wastageOptions = data.data.wastages;
      } else if (data && data.wastages) {
        this.wastageOptions = data.wastages;
      } else if (data && data.data) {
        this.wastageOptions = data.data;
      }

      console.log("AdminProduct: Wastage Options Set:", this.wastageOptions);
      this.cdr.detectChanges(); // Force UI update
    } catch (error) {
      console.error("AdminProduct: Failed to load wastage options", error);
      this.toastService.show("Failed to load categories", "error");
    }
  }

  onCategoryChange() {
    // Determine wastage based on the selected waste_id (value bound to ngModel)
    const selectedOption = this.wastageOptions.find(w => w.waste_id == this.product.category);
    if (selectedOption) {
      this.product.wastage = parseFloat(selectedOption.wastage);
      console.log(`AdminProduct: Category changed to ${this.product.category}, Wastage set to ${this.product.wastage}`);
    }
  }

  onSubmit() {
    const action = this.isEditMode
      ? this.productService.updateProduct(this.product.id, this.product, this.selectedImageFiles)
      : this.productService.addProduct(this.product, this.selectedImageFiles);

    action.subscribe({
      next: () => {
        this.toastService.show(
          this.isEditMode ? 'Product updated successfully' : 'Product created successfully',
          'success'
        );
        this.router.navigate(['/products']);
      },
      error: (err) => {
        console.error('Error saving product:', err);
        this.toastService.show('Failed to save product', 'error');
      }
    });
  }

  cancel() {
    this.router.navigate(['/products']);
  }
}
