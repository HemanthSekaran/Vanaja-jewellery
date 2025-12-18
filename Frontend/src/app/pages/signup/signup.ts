import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

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

    async onSubmit() {

        // Basic frontend validation
        if (!this.name.trim()) {
            alert("Name is required");
            return;
        }

        if (!this.email.trim()) {
            alert("Email is required");
            return;
        }

        if (!this.password.trim()) {
            alert("Password is required");
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
            const response = await this.authService.signup(user);
            alert("Registration successful! Please login.");
            this.router.navigate(['/login']);

        } catch (error: any) {
            console.error("Signup Error:", error);
        }
    }
}
