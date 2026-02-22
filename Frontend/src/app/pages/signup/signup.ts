import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [RouterLink, FormsModule],
    templateUrl: './signup.html',
})
export class Signup {

    name = '';
    email = '';
    phone = '';
    address = '';
    password = '';
    showPassword = signal(false);

    authService = inject(AuthService);
    router = inject(Router);
    toastService = inject(ToastService);

    togglePassword() {
        this.showPassword.set(!this.showPassword());
    }

    async onSubmit() {
        if (!this.name.trim()) {
            this.toastService.error("Name is required");
            return;
        }

        if (!this.email.trim()) {
            this.toastService.error("Email is required");
            return;
        }

        if (!this.password.trim()) {
            this.toastService.error("Password is required");
            return;
        }

        const user = {
            name: this.name.trim(),
            email: this.email.trim(),
            password: this.password.trim(),
            phone: this.phone?.trim() || '',
            address: this.address?.trim() || '',
            role: 'user'
        };

        try {
            await this.authService.signup(user);
            this.toastService.success("Registration successful! Please login.");
            this.router.navigate(['/login']);

        } catch (error: any) {
            console.error("Signup Error:", error);
            this.toastService.error("An error occurred during registration. Please try again.");
        }
    }
}
