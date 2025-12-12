import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

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

    onSubmit() {
        if (this.email && this.password) {
            if (this.authService.login(this.email, this.password)) {
                this.router.navigate(['/']);
            } else {
                alert('Invalid credentials');
            }
        }
    }
}
