import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-customization',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './customization.html',
    styleUrls: ['./customization.css']
})
export class customization {
    customizationForm: FormGroup;
    isSubmitting = false;

    constructor(private fb: FormBuilder) {
        this.customizationForm = this.fb.group({
            designName: ['', Validators.required],
            material: ['', Validators.required],
            weightage: ['', [Validators.required, Validators.min(0.1)]],
            description: ['', Validators.required],
            image: [null]
        });
    }

    imageDetails: { name: string, size: string, preview: string }[] = [];

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        const files = event.dataTransfer?.files;
        if (files) {
            this.handleFiles(files);
        }
    }

    onFileSelected(event: any) {
        const files = event.target.files;
        if (files) {
            this.handleFiles(files);
        }
    }

    handleFiles(files: FileList) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.imageDetails.push({
                    name: file.name,
                    size: this.formatFileSize(file.size),
                    preview: e.target.result
                });
            };
            reader.readAsDataURL(file);
        }
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeImage(index: number) {
        this.imageDetails.splice(index, 1);
    }

    onSubmit(): void {
        if (this.customizationForm.valid) {
            this.isSubmitting = true;
            console.log('Form Submitted', this.customizationForm.value);
            console.log('Form Submitted', this.customizationForm.value);

            // Simulate API call
            setTimeout(() => {
                alert('Your customization request has been submitted successfully! We will contact you shortly.');
                this.isSubmitting = false;
                this.customizationForm.reset();
                this.imageDetails = [];
            }, 1500);
        } else {
            this.customizationForm.markAllAsTouched();
        }
    }
}
