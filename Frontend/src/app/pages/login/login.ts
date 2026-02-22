import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [RouterLink, FormsModule],
    templateUrl: './login.html',
})
export class Login {
    email = '';
    password = '';
    showPassword = signal(false);
    authService = inject(AuthService);
    router = inject(Router);
    toastService = inject(ToastService);

    togglePassword() {
        this.showPassword.set(!this.showPassword());
    }

    async onSubmit() {
        if (this.email && this.password) {
            const success = await this.authService.login(this.email, this.password);
            if (success) {
                this.router.navigate(['/']);
            } else {
                this.toastService.error("Invalid credentials. Please try again.");
            }
        }
    }
}
