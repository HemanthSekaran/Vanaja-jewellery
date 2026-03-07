import { Component, inject, signal, OnDestroy } from '@angular/core';
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
export class Signup implements OnDestroy {

    fb = inject(FormBuilder);
    authService = inject(AuthService);
    router = inject(Router);
    toastService = inject(ToastService);

    signupForm: FormGroup;
    otpForm: FormGroup;
    showOtpStep = signal(false);
    isSubmitting = false;

    // Timer Properties
    timer = signal(300); // 5 minutes in seconds
    timerDisplay = signal('05:00');
    private timerInterval: any;

    constructor() {
        this.signupForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
            address: ['']
        });

        this.otpForm = this.fb.group({
            otp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
        });
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
            phone: formValue.phone?.trim() || '',
            address: formValue.address?.trim() || '',
            role: 'user'
        };

        try {
            const success = await this.authService.signup(user);
            if (success) {
                this.showOtpStep.set(true);
                this.startTimer();
            }
        } catch (error: any) {
            console.error("Signup Error:", error);
            this.toastService.error(error.error?.message || "An error occurred during registration.");
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
        const { email } = this.signupForm.value;
        const { otp } = this.otpForm.value;

        try {
            const success = await this.authService.verifySignup(email, otp);
            if (success) {
                this.stopTimer();
                this.router.navigate(['/']);
            }
        } catch (error: any) {
            this.toastService.error(error.error?.message || "Invalid OTP.");
        } finally {
            this.isSubmitting = false;
        }
    }

    startTimer() {
        this.stopTimer();
        this.timer.set(300);
        this.updateTimerDisplay();

        this.timerInterval = setInterval(() => {
            if (this.timer() > 0) {
                this.timer.update(t => t - 1);
                this.updateTimerDisplay();
            } else {
                this.stopTimer();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timer() / 60);
        const seconds = this.timer() % 60;
        this.timerDisplay.set(
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
    }

    async resendOtp() {
        if (this.isSubmitting || this.timer() > 0) return;

        this.isSubmitting = true;
        const formValue = this.signupForm.value;
        const user = {
            name: formValue.name.trim(),
            email: formValue.email.trim(),
            phone: formValue.phone?.trim() || '',
            address: formValue.address?.trim() || '',
            role: 'user'
        };

        try {
            const success = await this.authService.signup(user);
            if (success) {
                this.toastService.success("OTP Resent successfully");
                this.startTimer();
            }
        } catch (error: any) {
            this.toastService.error(error.error?.message || "Failed to resend OTP.");
        } finally {
            this.isSubmitting = false;
        }
    }

    backToSignup() {
        this.stopTimer();
        this.showOtpStep.set(false);
    }

    ngOnDestroy() {
        this.stopTimer();
    }
}
