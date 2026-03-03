import { Component, EventEmitter, Output, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
