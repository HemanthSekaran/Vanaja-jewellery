import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const toastService = inject(ToastService);

    if (authService.isLoggedIn()) {
        return true;
    }

    toastService.show('Please login to access this page', 'error');

    // Redirect to home and reload
    setTimeout(() => {
        window.location.href = '/';
    }, 2000);

    return false;
};

export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const toastService = inject(ToastService);

    const user = authService.currentUser();

    if (authService.isLoggedIn() && user?.role === 'admin') {
        return true;
    }

    toastService.show('You do not have permission to access this page', 'error');
    router.navigate(['/']);
    return false;
};
