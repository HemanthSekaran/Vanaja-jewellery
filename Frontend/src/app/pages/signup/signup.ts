import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';

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

    authService = inject(AuthService);
    router = inject(Router);
    alertService = inject(AlertService);

    async onSubmit() {
        if (!this.name.trim()) {
            this.alertService.error("Validation Error", "Name is required");
            return;
        }

        if (!this.email.trim()) {
            this.alertService.error("Validation Error", "Email is required");
            return;
        }

        if (!this.password.trim()) {
            this.alertService.error("Validation Error", "Password is required");
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
            await this.alertService.success("Success", "Registration successful! Please login.");
            this.router.navigate(['/login']);

        } catch (error: any) {
            console.error("Signup Error:", error);
            this.alertService.error("Registration Failed", "An error occurred during registration. Please try again.");
        }
    }
}
