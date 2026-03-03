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
    otpForm: FormGroup;
    showOtpStep = signal(false);
    isSubmitting = false;

    constructor() {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });

        this.otpForm = this.fb.group({
            otp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
        });
    }

    async onSubmit() {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        const { email } = this.loginForm.value;

        try {
            const success = await this.authService.login(email);
            if (success) {
                this.showOtpStep.set(true);
            }
        } finally {
            this.isSubmitting = false;
        }
    }

    async onVerifyOtp() {
        if (this.otpForm.invalid) {
            this.otpForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        const { email } = this.loginForm.value;
        const { otp } = this.otpForm.value;

        try {
            const success = await this.authService.verifyLogin(email, otp);
            if (success) {
                this.router.navigate(['/']);
            } else {
                this.toastService.error("Invalid OTP. Please try again.");
            }
        } finally {
            this.isSubmitting = false;
        }
    }

    backToEmail() {
        this.showOtpStep.set(false);
    }
}
