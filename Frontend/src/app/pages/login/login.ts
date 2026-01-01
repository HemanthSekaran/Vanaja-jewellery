import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [RouterLink, FormsModule],
    templateUrl: './login.html',
})
export class Login {
    email = '';
    password = '';
    authService = inject(AuthService);
    router = inject(Router);
    alertService = inject(AlertService);

    async onSubmit() {
        if (this.email && this.password) {
            const success = await this.authService.login(this.email, this.password);
            if (success) {
                this.router.navigate(['/']);
            } else {
                this.alertService.error("Login Failed", "Invalid credentials. Please try again.");
            }
        }
    }
}
