import { Injectable, NgZone, inject, effect } from '@angular/core';
import { AuthService } from './auth.service';
import { fromEvent, merge, Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class SessionMonitoringService {
    private authService = inject(AuthService);
    private ngZone = inject(NgZone);

    private inactivityTimeout = 45 * 60 * 1000; // 45 minutes in milliseconds
    private tokenCheckInterval = 5000; // Check every 5 seconds

    private activitySubscription?: Subscription;
    private tokenCheckSubscription?: Subscription;

    constructor() {
        // React to login/logout state changes
        effect(() => {
            const user = this.authService.currentUser();
            if (user) {
                this.startMonitoring();
            } else {
                this.stopMonitoring();
            }
        });
    }

    private startMonitoring() {
        this.stopMonitoring(); // Ensure no duplicate monitoring subscriptions

        // Monitor for user activity to reset inactivity timer
        this.ngZone.runOutsideAngular(() => {
            const activityEvents = merge(
                fromEvent(window, 'mousemove'),
                fromEvent(window, 'keydown'),
                fromEvent(window, 'click'),
                fromEvent(window, 'scroll'),
                fromEvent(window, 'touchstart')
            );

            // Reset the inactivity timer on every activity event
            this.activitySubscription = activityEvents.pipe(
                switchMap(() => timer(this.inactivityTimeout))
            ).subscribe(() => {
                this.ngZone.run(() => {
                    console.warn('Inactivity timeout reached. Logging out...');
                    this.authService.logout();
                });
            });

            // Also start an initial timer that runs if no activity occurs at all
            const initialTimer = timer(this.inactivityTimeout).subscribe(() => {
                this.ngZone.run(() => {
                    console.warn('Inactivity timeout reached (no initial activity). Logging out...');
                    this.authService.logout();
                });
            });
            this.activitySubscription.add(initialTimer);
        });

        // Periodically check if the auth_token is still present in sessionStorage
        this.tokenCheckSubscription = timer(0, this.tokenCheckInterval).subscribe(() => {
            // If we are intentionally logging out, stop checking
            if (this.authService.isLoggingOut()) {
                return;
            }

            const token = sessionStorage.getItem('auth_token');
            if (this.authService.isLoggedIn() && !token) {
                console.warn('Auth token missing from sessionStorage. Logging out...');
                this.authService.logout();
            }
        });
    }

    /**
     * Stops all monitoring subscriptions.
     */
    stopMonitoring() {
        this.activitySubscription?.unsubscribe();
        this.tokenCheckSubscription?.unsubscribe();
    }
}
