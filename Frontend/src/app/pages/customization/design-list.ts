import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

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

    constructor(
        private api: ApiService,
        private router: Router,
        private cd: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.fetchDesigns();
    }

    fetchDesigns() {
        this.loading = true;
        this.errorMessage = null;
        this.api.getUserDesigns()
            .then(res => {
                if (res.data && res.data.success && res.data.data && Array.isArray(res.data.data.designs)) {
                    this.designs = res.data.data.designs;
                } else if (res.data && Array.isArray(res.data)) {
                    // Fallback if structure is different
                    this.designs = res.data;
                } else {
                    // Try to find an array in the response
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

    createNew() {
        this.router.navigate(['/customization']);
    }

    editDesign(id: string) {
        this.router.navigate(['/customization/edit', id]);
    }

    getImageUrl(filename: string): string {
        return this.api.getDesignImageUrl(filename);
    }
}
