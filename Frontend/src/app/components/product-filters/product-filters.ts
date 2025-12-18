import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-filters',
  imports: [CommonModule, FormsModule],
  templateUrl: './product-filters.html',
  styleUrl: './product-filters.css'
})
export class ProductFilters {
  @Output() filterChange = new EventEmitter<any>();

  searchTerm: string = '';
  selectedCategory: string = 'All';
  selectedMetalType: string = 'All';
  priceRange: number = 500000;
  selectedWeightRanges: { [key: string]: boolean } = {};
  selectedPurities: { [key: string]: boolean } = {};

  categories = ['All', 'Rings', 'Necklaces', 'Earrings', 'Bracelets'];
  metalTypes = ['All', 'Gold', 'Silver', 'Platinum'];

  weightRanges = [
    { label: '0 - 2 g', min: 0, max: 2 },
    { label: '2 - 5 g', min: 2, max: 5 },
    { label: '5 - 10 g', min: 5, max: 10 },
    { label: '10 - 20 g', min: 10, max: 20 },
    { label: '20+ g', min: 20, max: 9999 }
  ];

  purities = ['24K', '22K', '18K', '925 Silver', '950 Platinum'];

  // Accordion State
  openSections: { [key: string]: boolean } = {
    'category': true,
    'metalType': true,
    'purity': true,
    'weight': true,
    'price': true
  };

  toggleSection(section: string) {
    this.openSections[section] = !this.openSections[section];
  }

  onFilterChange() {
    this.filterChange.emit({
      search: this.searchTerm,
      category: this.selectedCategory === 'All' ? '' : this.selectedCategory.toLowerCase(),
      metalType: this.selectedMetalType === 'All' ? '' : this.selectedMetalType,
      priceRange: this.priceRange,
      weightRanges: this.weightRanges.filter(r => this.selectedWeightRanges[r.label]),
      purities: this.purities.filter(p => this.selectedPurities[p])
    });
  }
}
