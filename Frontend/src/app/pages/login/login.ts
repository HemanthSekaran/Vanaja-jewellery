import { Component, inject, signal, OnDestroy } from '@angular/core';
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
export class Login implements OnDestroy {
    authService = inject(AuthService);
    router = inject(Router);
    toastService = inject(ToastService);
    fb = inject(FormBuilder);

    loginForm: FormGroup;
    otpForm: FormGroup;
    showOtpStep = signal(false);
    isSubmitting = false;

    // Timer Properties
    timer = signal(300); // 5 minutes in seconds
    timerDisplay = signal('05:00');
    private timerInterval: any;

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
                this.startTimer();
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
                this.stopTimer();
                this.router.navigate(['/']);
            } else {
                this.toastService.error("Invalid OTP. Please try again.");
            }
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
        const { email } = this.loginForm.value;

        try {
            const success = await this.authService.login(email);
            if (success) {
                this.toastService.success("OTP Resent successfully");
                this.startTimer();
            }
        } finally {
            this.isSubmitting = false;
        }
    }

    backToEmail() {
        this.stopTimer();
        this.showOtpStep.set(false);
    }

    ngOnDestroy() {
        this.stopTimer();
    }
}
