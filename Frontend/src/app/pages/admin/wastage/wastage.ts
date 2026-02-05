import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { AlertService } from '../../../services/alert.service';

export interface Wastage {
    waste_id: number;
    jewel_type: string;
    wastage: string;
    created_at: string;
    updated_at: string;
}

@Component({
    selector: 'app-wastage',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './wastage.html',
    styleUrls: ['./wastage.css']
})
export class WastageComponent implements OnInit {
    apiService = inject(ApiService);
    toastService = inject(ToastService);
    alertService = inject(AlertService);
    titleService = inject(Title);

    wastages = signal<Wastage[]>([]);
    isLoading = signal<boolean>(false);
    isModalOpen = signal<boolean>(false);
    isEditing = signal<boolean>(false);

    // Form Data
    currentId = signal<number | null>(null);
    jewelType = signal<string>('');
    wastageValue = signal<string>('');

    ngOnInit() {
        this.titleService.setTitle('Wastage Management | Sri Vanaja Jewellery');
        this.loadWastages();
    }

    async loadWastages() {
        this.isLoading.set(true);
        try {
            const response = await this.apiService.getWastages();
            // Handle axios response structure: response.data is the body, body.data is the payload
            const body = response.data;
            if (body && body.data && body.data.wastages) {
                this.wastages.set(body.data.wastages);
            } else if (body && body.wastages) {
                // Fallback if structure is flat
                this.wastages.set(body.wastages);
            }
        } catch (error) {
            this.toastService.show('Failed to load wastages', 'error');
        } finally {
            this.isLoading.set(false);
        }
    }

    openAddModal() {
        this.resetForm();
        this.isEditing.set(false);
        this.isModalOpen.set(true);
    }

    openEditModal(item: Wastage) {
        this.currentId.set(item.waste_id);
        this.jewelType.set(item.jewel_type);
        this.wastageValue.set(item.wastage);
        this.isEditing.set(true);
        this.isModalOpen.set(true);
    }

    closeModal() {
        this.isModalOpen.set(false);
        this.resetForm();
    }

    resetForm() {
        this.currentId.set(null);
        this.jewelType.set('');
        this.wastageValue.set('');
    }

    async saveWastage() {
        if (!this.jewelType() || !this.wastageValue()) {
            this.toastService.show('Please fill all fields', 'error');
            return;
        }

        try {
            const data = {
                jewel_type: this.jewelType(),
                wastage: this.wastageValue()
            };

            if (this.isEditing() && this.currentId()) {
                await this.apiService.updateWastage(this.currentId()!, data);
                this.toastService.show('Wastage updated successfully', 'success');
            } else {
                await this.apiService.createWastage(data);
                this.toastService.show('Wastage added successfully', 'success');
            }

            this.closeModal();
            this.loadWastages();
        } catch (error: any) {
            this.toastService.show(error.message || 'Operation failed', 'error');
        }
    }

    async deleteWastage(id: number) {
        const confirmed = await this.alertService.confirm(
            'Delete Wastage Type',
            'Are you sure you want to delete this wastage type? This action cannot be undone.',
            'Delete',
            'Cancel'
        );

        if (!confirmed) {
            return;
        }

        try {
            await this.apiService.deleteWastage(id);
            this.toastService.show('Wastage deleted successfully', 'success');
            this.loadWastages();
        } catch (error: any) {
            this.toastService.show(error.message || 'Delete failed', 'error');
        }
    }
}
