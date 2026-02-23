import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [RouterLink, ReactiveFormsModule, CommonModule],
    templateUrl: './signup.html',
})
export class Signup {

    fb = inject(FormBuilder);
    authService = inject(AuthService);
    router = inject(Router);
    toastService = inject(ToastService);

    signupForm: FormGroup;
    showPassword = signal(false);
    isSubmitting = false;

    constructor() {
        this.signupForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
            address: ['', [Validators.required]]
        });
    }

    togglePassword() {
        this.showPassword.set(!this.showPassword());
    }

    async onSubmit() {
        if (this.signupForm.invalid) {
            this.signupForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        const formValue = this.signupForm.value;

        const user = {
            name: formValue.name.trim(),
            email: formValue.email.trim(),
            password: formValue.password.trim(),
            phone: formValue.phone?.trim() || '',
            address: formValue.address?.trim() || '',
            role: 'user'
        };

        try {
            await this.authService.signup(user);
            this.toastService.success("Registration successful! Please login.");
            this.router.navigate(['/login']);

        } catch (error: any) {
            console.error("Signup Error:", error);
            this.toastService.error(error.error?.message || "An error occurred during registration. Please try again.");
        } finally {
            this.isSubmitting = false;
        }
    }
}
