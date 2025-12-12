import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';

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
    password = ''; // Added password field for completeness, though mock service doesn't store it securely

    authService = inject(AuthService);
    router = inject(Router);

    onSubmit() {
        if (this.name && this.email && this.password) {
            const user: User = {
                name: this.name,
                email: this.email,
                phone: this.phone,
                address: this.address,
                role: 'client'
            };

            this.authService.signup(user);
            this.router.navigate(['/']);
        }
    }
}
