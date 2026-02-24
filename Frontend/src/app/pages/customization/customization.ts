import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-customization',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './customization.html',
    styleUrls: ['./customization.css']
})
export class CustomizationComponent {

    customizationForm: FormGroup;
    isSubmitting = false;
    editMode = false; // Added editMode
    designId: string | null = null; // Added designId
    imageDetails: {
        file?: File; // Made optional
        name: string;
        size: string;
        preview: string;
        existing?: boolean; // Added existing property
    }[] = [];

    constructor(
        private fb: FormBuilder,
        private cd: ChangeDetectorRef,
        private api: ApiService,
        private route: ActivatedRoute, // Injected ActivatedRoute
        public router: Router, // Injected Router
        private toastService: ToastService,
        public auth: AuthService
    ) {
        this.customizationForm = this.fb.group({
            design_name: ['', Validators.required],
            material_preference: ['', Validators.required],
            approximate_weight: ['', [Validators.required, Validators.min(0.1)]],
            description: ['', Validators.required]
        });

        // Logic to check for route parameters and set edit mode
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.editMode = true;
                this.designId = params['id'];
                this.loadDesign(this.designId!);
            }
        });
    }

    // New method to load design details for editing
    loadDesign(id: string) {
        this.api.getDesign(id).then(res => {
            // Check structure: res.data.data.design or res.data.design
            const data = res.data.data?.design || res.data.design || res.data;

            this.customizationForm.patchValue({
                design_name: data.design_name,
                material_preference: data.material_preference,
                approximate_weight: data.approximate_weight,
                description: data.description
            });
            // Handle existing images if any (Assuming backend returns array of URLs)
            if (data.reference_images && Array.isArray(data.reference_images)) {
                this.imageDetails = data.reference_images.map((url: string) => ({
                    name: 'Existing Image',
                    size: 'Unknown', // Size might not be available from URL, or fetch if needed
                    preview: url,
                    existing: true
                }));
            }
        }).catch(err => {
            console.error('Failed to load design', err);
            this.toastService.error('Failed to load design details');
        });
    }

    // ---------- FILE HANDLING ----------

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        if (event.dataTransfer?.files) {
            this.handleFiles(event.dataTransfer.files);
        }
    }

    onFileSelected(event: any) {
        if (event.target.files) {
            this.handleFiles(event.target.files);
        }
    }

    handleFiles(files: FileList) {
        // Limit total number of images to 3
        if (this.imageDetails.length + files.length > 3) {
            this.toastService.error('You can only upload a maximum of 3 images.');
            return;
        }

        Array.from(files).forEach(file => {
            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                this.toastService.error(`File "${file.name}" is too large. Maximum size is 5MB.`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.imageDetails.push({
                    file, // Include the file object for new uploads
                    name: file.name,
                    size: this.formatFileSize(file.size),
                    preview: e.target.result,
                    existing: false // Mark as new file
                });
                this.cd.detectChanges();
            };
            reader.readAsDataURL(file);
        });
    }

    removeImage(index: number) {
        this.imageDetails.splice(index, 1);
    }

    formatFileSize(bytes: number): string {
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
    }

    // ---------- SUBMIT ----------

    onSubmit(): void {
        if (this.customizationForm.invalid) {
            this.customizationForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;

        const formData = new FormData();

        formData.append('design_name', this.customizationForm.value.design_name);
        formData.append('material_preference', this.customizationForm.value.material_preference);
        formData.append('approximate_weight', this.customizationForm.value.approximate_weight);
        formData.append('description', this.customizationForm.value.description);

        // Append new images (not existing ones)
        this.imageDetails.forEach((img) => {
            if (!img.existing && img.file) { // Only append files that are new and have a file object
                formData.append('reference_images', img.file);
            }
        });

        // Determine whether to submit a new design or update an existing one
        const promise = this.editMode
            ? this.api.updateDesign(this.designId!, formData) // Assuming updateDesign method exists in ApiService
            : this.api.submitCustomization(formData);

        promise
            .then(async () => {
                this.toastService.success(this.editMode ? 'Design updated successfully!' : 'Design request submitted successfully!');
                if (!this.editMode) {
                    this.customizationForm.reset();
                    this.imageDetails = [];
                } else {
                    // Navigate to a list or detail page after update
                    this.router.navigate(['/customization/design-list']);
                }
            })
            .catch(err => {
                console.error(err);
                this.toastService.error(this.editMode ? 'Failed to update design' : 'Failed to submit design request');
            })
            .finally(() => {
                this.isSubmitting = false;
            });
    }
}
