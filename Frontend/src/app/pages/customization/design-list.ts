import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AlertService } from '../../services/alert.service';

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

    constructor(
        private api: ApiService,
        private router: Router,
        private cd: ChangeDetectorRef,
        private alertService: AlertService // Add injection
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
                // Fallback to normal user fetch if auth fails, though likely interceptor handles it
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
                console.log('Designs loaded:', this.designs);
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
                // Update local state
                const design = this.designs.find(d => d.id === id);
                if (design) {
                    design.status = status;
                    this.cd.detectChanges();
                }
            })
            .catch(err => {
                console.error("Failed to update status", err);
                this.alertService.error('Action Failed', "Failed to update status");
            });
    }

    createNew() {
        this.router.navigate(['/customization']);
    }

    editDesign(id: string) {
        this.router.navigate(['/customization/edit', id]);
    }

    getImageUrl(filename: string): string {
        if (!filename) return '';
        if (filename.startsWith('http')) return filename;
        return `http://localhost:5000/uploads/designs/${filename}`;
    }
}
