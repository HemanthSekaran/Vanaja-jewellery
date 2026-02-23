import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [RouterLink, ReactiveFormsModule, CommonModule],
    templateUrl: './login.html',
})
export class Login {
    authService = inject(AuthService);
    router = inject(Router);
    toastService = inject(ToastService);
    fb = inject(FormBuilder);

    loginForm: FormGroup;
    showPassword = signal(false);
    isSubmitting = false;

    constructor() {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    togglePassword() {
        this.showPassword.set(!this.showPassword());
    }

    async onSubmit() {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        const { email, password } = this.loginForm.value;

        try {
            const success = await this.authService.login(email, password);
            if (success) {
                this.router.navigate(['/']);
            } else {
                this.toastService.error("Invalid credentials. Please try again.");
            }
        } catch (error: any) {
            this.toastService.error(error.error?.message || "An error occurred during login.");
        } finally {
            this.isSubmitting = false;
        }
    }
}
