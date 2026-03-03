import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AlertService } from '../../services/alert.service';
import { ToastService } from '../../services/toast.service';
import { ExportService } from '../../services/export.service';

@Component({
    selector: 'app-design-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './design-list.html',
})
export class DesignListComponent implements OnInit {
    designs: any[] = [];
    loading = true;
    errorMessage: string | null = null;
    isAdmin: boolean = false;
    selectedImage: string | null = null;

    constructor(
        private api: ApiService,
        private router: Router,
        private cd: ChangeDetectorRef,
        private alertService: AlertService,
        private toastService: ToastService,
        private exportService: ExportService
    ) { }

    ngOnInit() {
        this.checkUserRole();
    }

    checkUserRole() {
        this.api.getProfile()
            .then(res => {
                const user = res.data.data?.user || res.data.user;
                this.isAdmin = user?.role === 'admin';
                this.fetchDesigns();
            })
            .catch(err => {
                console.error("Failed to fetch profile", err);
                this.fetchDesigns();
            });
    }

    fetchDesigns() {
        this.loading = true;
        this.errorMessage = null;

        const fetchPromise = this.isAdmin ? this.api.getAllDesigns() : this.api.getUserDesigns();

        fetchPromise
            .then(res => {
                if (res.data && res.data.success && res.data.data && Array.isArray(res.data.data.designs)) {
                    this.designs = res.data.data.designs;
                } else if (res.data && Array.isArray(res.data)) {
                    this.designs = res.data;
                } else {
                    const possibleArray = Object.values(res.data.data || res.data).find(val => Array.isArray(val));
                    this.designs = (possibleArray as any[]) || [];
                }
            })
            .catch(err => {
                console.error("Failed to fetch designs", err);
                this.errorMessage = "Failed to load designs. Please check your connection or try again later.";
                if (err.response && err.response.data && err.response.data.message) {
                    this.errorMessage = err.response.data.message;
                }
            })
            .finally(() => {
                this.loading = false;
                this.cd.detectChanges();
            });
    }

    async updateStatus(id: string, status: string) {
        const confirmed = await this.alertService.confirm('Update Status', `Are you sure you want to change status to ${status}?`);
        if (!confirmed) return;

        this.api.updateDesignStatus(id, status)
            .then(() => {
                const design = this.designs.find(d => d.id === id);
                if (design) {
                    design.status = status;
                    this.cd.detectChanges();
                    this.toastService.success('Status updated successfully');
                }
            })
            .catch(err => {
                console.error("Failed to update status", err);
                this.toastService.error("Failed to update status");
            });
    }

    createNew() {
        this.router.navigate(['/customization']);
    }

    getImageUrl(filename: string): string {
        if (!filename) return 'assets/images/placeholder-design.jpg';
        if (filename.startsWith('http')) return filename;
        // In local dev, backend might be on localhost:5000
        return `http://localhost:5000/uploads/designs/${filename}`;
    }

    onImageError(event: any) {
        event.target.src = 'assets/images/placeholder-design.jpg';
    }

    openLightbox(imageUrl: string) {
        this.selectedImage = imageUrl;
        document.body.style.overflow = 'hidden';
    }

    closeLightbox() {
        this.selectedImage = null;
        document.body.style.overflow = 'auto';
    }

    downloadImage(imageUrl: string) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = imageUrl.split('/').pop() || 'design-image.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    exportToExcel() {
        const exportData = this.designs.map(design => ({
            'Design ID': design.id,
            'Name': design.design_name,
            'Customer': this.isAdmin ? (design.user_name || 'Anonymous') : 'Me',
            'Material': design.material_preference,
            'Est. Weight (g)': design.approximate_weight,
            'Status': design.status,
            'Created At': new Date(design.created_at).toLocaleDateString()
        }));

        this.exportService.exportToExcel(exportData, `Customizations_${this.isAdmin ? 'Admin' : 'User'}_${new Date().getTime()}`);
    }

    exportToPDF() {
        const headers = ['ID', 'Name', 'Material', 'Weight', 'Status', 'Date'];
        const data = this.designs.map(design => [
            `#${design.id}`,
            design.design_name,
            design.material_preference,
            `${design.approximate_weight}g`,
            design.status,
            new Date(design.created_at).toLocaleDateString()
        ]);

        const title = this.isAdmin ? 'All Customizations Report' : 'My Customizations Report';
        this.exportService.exportToPDF(headers, data, `Customizations_${this.isAdmin ? 'Admin' : 'User'}_${new Date().getTime()}`, title);
    }
}
