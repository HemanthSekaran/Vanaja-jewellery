import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MetalPriceService } from '../../services/metal-price.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-metal-price-banner',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './metal-price-banner.html',
    styleUrl: './metal-price-banner.css',
})
export class MetalPriceBanner {
    metalPriceService = inject(MetalPriceService);
    authService = inject(AuthService);

    // Edit state
    editingMetal = signal<string | null>(null);
    editPrice = signal<number>(0);

    isAdmin = computed(() => {
        const user = this.authService.currentUser();
        console.log('MetalPriceBanner: Current User:', user); // Debug log
        return user?.role?.toLowerCase() === 'admin';
    });

    startEdit(metalName: string, currentPrice: number) {
        this.editingMetal.set(metalName);
        this.editPrice.set(currentPrice);
    }

    cancelEdit() {
        this.editingMetal.set(null);
        this.editPrice.set(0);
    }

    async saveEdit(metalName: string) {
        const newPrice = this.editPrice();

        if (newPrice <= 0) {
            return;
        }

        const success = await this.metalPriceService.updateMetalPrice(metalName, newPrice);

        if (success) {
            this.cancelEdit();
        }
    }

    formatPrice(price: number): string {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price);
    }
}
