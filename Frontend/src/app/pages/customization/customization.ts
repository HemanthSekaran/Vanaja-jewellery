import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

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

    imageDetails: {
        file: File;
        name: string;
        size: string;
        preview: string;
    }[] = [];

    constructor(
        private fb: FormBuilder,
        private cd: ChangeDetectorRef,
        private api: ApiService
    ) {
        this.customizationForm = this.fb.group({
            design_name: ['', Validators.required],
            material_preference: ['', Validators.required],
            approximate_weight: ['', [Validators.required, Validators.min(0.1)]],
            description: ['', Validators.required]
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
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.imageDetails.push({
                    file,
                    name: file.name,
                    size: this.formatFileSize(file.size),
                    preview: e.target.result
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

        // Backend supports SINGLE image → take first image
        if (this.imageDetails.length > 0) {
            formData.append('reference_image', this.imageDetails[0].file);
        }

        this.api.submitCustomization(formData)
            .then(() => {
                alert('Design request submitted successfully!');
                this.customizationForm.reset();
                this.imageDetails = [];
            })
            .catch(err => {
                console.error(err);
                alert('Failed to submit design request');
            })
            .finally(() => {
                this.isSubmitting = false;
            });
    }
}
