import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-mobile-menu',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './mobile-menu.html',
    styleUrls: ['./mobile-menu.css'] // Using styleUrls for standard Angular behavior
})
export class MobileMenu {
    @Input() isOpen = false;
    @Output() close = new EventEmitter<void>();

    // Menu Categories with sub-items
    menuCategories = [
        {
            title: 'Gold Jewellery',
            isOpen: false,
            items: [
                { label: 'Gold Bangles', link: '/products', queryParams: { category: 'bangles', metalType: 'Gold' } },
                { label: 'Gold Necklace', link: '/products', queryParams: { category: 'necklaces', metalType: 'Gold' } },
                { label: 'Gold Earrings', link: '/products', queryParams: { category: 'earrings', metalType: 'Gold' } },
                { label: 'Gold Rings', link: '/products', queryParams: { category: 'rings', metalType: 'Gold' } },
            ]
        },

        {
            title: 'Silver',
            isOpen: false,
            items: [
                { label: 'Silver Anklets', link: '/products', queryParams: { category: 'anklets', metalType: 'Silver' } },
                { label: 'Silver Chains', link: '/products', queryParams: { category: 'necklaces', metalType: 'Silver' } }
            ]
        },
        {
            title: 'Coins',
            isOpen: false,
            items: [
                { label: 'Gold Coins', link: '/products', queryParams: { category: 'coins', metalType: 'Gold' } },
                { label: 'Silver Coins', link: '/products', queryParams: { category: 'coins', metalType: 'Silver' } }
            ]
        }
    ];



    toggleCategory(index: number) {
        this.menuCategories[index].isOpen = !this.menuCategories[index].isOpen;
    }

    onClose() {
        this.close.emit();
    }
}
