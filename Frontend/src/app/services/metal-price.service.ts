import { Injectable, signal } from '@angular/core';
import { ApiService } from './api.service';
import { ToastService } from './toast.service';

export interface MetalPrice {
    s_no: number;
    metal_name: string;
    price: number;
    created_at?: string;
    updated_at?: string;
}

@Injectable({
    providedIn: 'root',
})
export class MetalPriceService {
    metalPrices = signal<MetalPrice[]>([]);
    isLoading = signal<boolean>(false);
    error = signal<string | null>(null);

    constructor(
        private apiService: ApiService,
        private toastService: ToastService
    ) {
        // Load metal prices on initialization
        this.loadMetalPrices();
    }

    async loadMetalPrices() {
        this.isLoading.set(true);
        this.error.set(null);

        try {
            const response = await this.apiService.getMetalPrices();
            let data = response.data;

            console.log('Metal prices response:', data); // Debug log

            // Handle different response structures
            if (data && data.message && data.message.metalPrices) {
                this.metalPrices.set(data.message.metalPrices);
            } else if (data && data.data && data.data.metalPrices) {
                this.metalPrices.set(data.data.metalPrices);
            } else if (data && data.metalPrices) {
                this.metalPrices.set(data.metalPrices);
            } else if (Array.isArray(data)) {
                this.metalPrices.set(data);
            } else {
                console.error('Unexpected response structure:', data);
                this.error.set('Failed to parse metal prices');
            }
        } catch (error: any) {
            console.error('Error loading metal prices:', error);
            this.error.set('Failed to load metal prices');
        } finally {
            this.isLoading.set(false);
        }
    }

    async updateMetalPrice(metalName: string, price: number): Promise<boolean> {
        try {
            const response = await this.apiService.updateMetalPrice(metalName, price);

            if (response.data) {
                // Reload prices to get the updated values
                await this.loadMetalPrices();
                this.toastService.show(`${metalName} price updated successfully`, 'success');
                return true;
            }
            return false;
        } catch (error: any) {
            console.error('Error updating metal price:', error);
            const errorMessage = error.response?.data?.message || 'Failed to update metal price';
            this.toastService.show(errorMessage, 'error');
            return false;
        }
    }

    getMetalPrice(metalName: string): MetalPrice | undefined {
        return this.metalPrices().find(
            mp => mp.metal_name.toLowerCase() === metalName.toLowerCase()
        );
    }
}
