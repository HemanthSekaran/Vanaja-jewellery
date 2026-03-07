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
  selectedMetals: { [key: string]: boolean } = {};
  selectedPurities: { [key: string]: boolean } = {};
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

  // Accordion State
  openSections: { [key: string]: boolean } = {
    'search': true,
    'category': true,
    'metalType': true,
    'purity': true,
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

    // Reset all
    this.selectedCategories = {};
    this.selectedMetals = {};
    this.selectedPurities = {};
    this.selectedWeightRanges = {};

    // Re-apply
    if (this.externalFilters.categories) {
      this.externalFilters.categories.forEach((c: string) => this.selectedCategories[c] = true);
    }
    if (this.externalFilters.metals) {
      this.externalFilters.metals.forEach((m: string) => this.selectedMetals[m] = true);
    }
    if (this.externalFilters.purities) {
      this.externalFilters.purities.forEach((p: string) => this.selectedPurities[p] = true);
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
      case 'metalType':
        return Object.values(this.selectedMetals).filter(v => v).length;
      case 'purity':
        return Object.values(this.selectedPurities).filter(v => v).length;
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
      metals: Object.keys(this.selectedMetals).filter(k => this.selectedMetals[k]),
      purities: Object.keys(this.selectedPurities).filter(k => this.selectedPurities[k]),
      weightRanges: this.weightRanges
        .filter(r => this.selectedWeightRanges[r.label])
        .map(r => `${r.min}-${r.max}`)
    });
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCategories = {};
    this.selectedMetals = {};
    this.selectedPurities = {};
    this.selectedWeightRanges = {};
    this.onFilterChange();
  }
}
