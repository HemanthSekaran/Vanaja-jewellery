import { Component, EventEmitter, Output, OnInit, inject, ChangeDetectorRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-filters',
  imports: [CommonModule, FormsModule],
  templateUrl: './product-filters.html',
  styleUrl: './product-filters.css'
})
export class ProductFilters implements OnInit {
  private productService = inject(ProductService);
  private cd = inject(ChangeDetectorRef);
  @Output() filterChange = new EventEmitter<any>();
  @Input() resetTrigger: number = 0;
  @Input() externalFilters: any = null;

  searchTerm: string = '';
  selectedCategories: { [key: string]: boolean } = {};
  selectedWastageRanges: { [key: string]: boolean } = {};
  selectedWeightRanges: { [key: string]: boolean } = {};

  categories: string[] = [];
  metals: string[] = [];
  purities: string[] = [];

  weightRanges = [
    { label: '0 - 2 g', min: 0, max: 2 },
    { label: '2 - 5 g', min: 2, max: 5 },
    { label: '5 - 10 g', min: 5, max: 10 },
    { label: '10 - 20 g', min: 10, max: 20 },
    { label: '20+ g', min: 20, max: 1000 }
  ];

  wastageRanges = [
    { label: '2 - 5 %', min: 2, max: 5 },
    { label: '6 - 10 %', min: 6, max: 10 },
    { label: '10 - 15 %', min: 10, max: 15 },
    { label: '15 - 20 %', min: 15, max: 20 },
    { label: '20+ %', min: 20, max: 100 }
  ];

  // Accordion State
  openSections: { [key: string]: boolean } = {
    'search': true,
    'category': true,
    'wastage': true,
    'weight': true
  };

  ngOnInit() {
    this.loadFilterOptions();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['resetTrigger'] && !changes['resetTrigger'].firstChange) {
      this.syncWithExternalFilters();
    }
  }

  syncWithExternalFilters() {
    if (!this.externalFilters) return;

    this.searchTerm = this.externalFilters.search || '';

    // Re-apply
    if (this.externalFilters.categories) {
      this.externalFilters.categories.forEach((c: string) => this.selectedCategories[c] = true);
    }
    if (this.externalFilters.wastageRanges) {
      this.wastageRanges.forEach(r => {
        const rangeStr = `${r.min}-${r.max}`;
        if (this.externalFilters.wastageRanges.includes(rangeStr)) {
          this.selectedWastageRanges[r.label] = true;
        }
      });
    }
    if (this.externalFilters.weightRanges) {
      this.weightRanges.forEach(r => {
        const rangeStr = `${r.min}-${r.max}`;
        if (this.externalFilters.weightRanges.includes(rangeStr)) {
          this.selectedWeightRanges[r.label] = true;
        }
      });
    }
    this.cd.detectChanges();
  }

  loadFilterOptions() {
    this.productService.getFilterOptions().subscribe(options => {
      this.categories = options.categories || [];
      this.metals = options.metals || [];
      this.purities = options.purities || [];
      this.cd.detectChanges();
    });
  }

  toggleSection(section: string) {
    this.openSections[section] = !this.openSections[section];
  }

  getActiveCount(section: string): number {
    switch (section) {
      case 'category':
        return Object.values(this.selectedCategories).filter(v => v).length;
      case 'wastage':
        return Object.values(this.selectedWastageRanges).filter(v => v).length;
      case 'weight':
        return Object.values(this.selectedWeightRanges).filter(v => v).length;
      default:
        return 0;
    }
  }

  onFilterChange() {
    this.filterChange.emit({
      search: this.searchTerm,
      categories: Object.keys(this.selectedCategories).filter(k => this.selectedCategories[k]),
      wastageRanges: this.wastageRanges
        .filter(r => this.selectedWastageRanges[r.label])
        .map(r => `${r.min}-${r.max}`),
      weightRanges: this.weightRanges
        .filter(r => this.selectedWeightRanges[r.label])
        .map(r => `${r.min}-${r.max}`)
    });
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCategories = {};
    this.selectedWastageRanges = {};
    this.selectedWeightRanges = {};
    this.onFilterChange();
  }
}
