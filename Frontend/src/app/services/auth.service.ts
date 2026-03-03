import { Injectable, signal } from '@angular/core';
import { ApiService } from './api.service';
import { TokenService } from './token.service';
import { ToastService } from './toast.service';

export interface User {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    role: 'user' | 'admin';
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    currentUser = signal<User | null>(null);
    isLoggingOut = signal<boolean>(false);

    constructor(
        private apiService: ApiService,
        private tokenService: TokenService,
        private toastService: ToastService,
    ) {
        // Try to restore user from sessionStorage on init
        this.initializeUser();
    }

    private async initializeUser() {
        // If token exists, try to fetch profile
        const token = await this.tokenService.getToken();
        if (token) {
            try {
                // Determine if we have a stored user first for immediate UI
                const storedUser = sessionStorage.getItem('user');
                if (storedUser) {
                    let parsedData = JSON.parse(storedUser);
                    if (parsedData && parsedData.user) {
                        parsedData = parsedData.user;
                    }
                    this.currentUser.set(parsedData);
                }

                // Fetch fresh profile
                const response = await this.apiService.getProfile();

                // Handle different response structures
                let userData = response.data;
                // If it's wrapped in { success: true, data: { user: ... } }
                if (userData && userData.data) {
                    userData = userData.data;
                }
                // If user data is further nested in 'user' key
                if (userData && userData.user) {
                    userData = userData.user;
                }

                this.setCurrentUser(userData);
            } catch (e: any) {
                console.error('Failed to restore user session', e);
                // Only logout if it's an authentication error (401)
                // If it's a 429 or network error, we keep the stored user for UI stability
                if (e.response && e.response.status === 401) {
                    this.logout();
                }
            }
        }
    }

    async login(email: string): Promise<boolean> {
        try {
            await this.apiService.login({ email });
            this.toastService.show('OTP sent to your email', 'success');
            return true;
        } catch (error) {
            console.error('Login request failed', error);
            return false;
        }
    }

    async verifyLogin(email: string, otp: string): Promise<boolean> {
        try {
            const response = await this.apiService.loginVerify({ email, otp });

            // Handle different response structures (direct object or wrapped in 'data')
            let responseData = response.data;
            if (responseData && responseData.data && !responseData.token) {
                responseData = responseData.data;
            }

            if (responseData && responseData.token) {
                this.tokenService.setToken(responseData.token);

                // Use the user object from the response if available
                if (responseData.user) {
                    this.setCurrentUser(responseData.user);
                } else {
                    // Fallback to fetching profile
                    const profileResponse = await this.apiService.getProfile();
                    let profileData = profileResponse.data;
                    if (profileData && profileData.data) {
                        profileData = profileData.data;
                    }
                    this.setCurrentUser(profileData);
                }
                this.toastService.show('Login successful', 'success');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login verification failed', error);
            return false;
        }
    }

    async signup(user: any): Promise<boolean> {
        try {
            await this.apiService.register(user);
            this.toastService.show('OTP sent to your email', 'success');
            return true;
        } catch (error) {
            console.error('Signup failed', error);
            throw error; // Let component handle error message
        }
    }

    async verifySignup(email: string, otp: string): Promise<boolean> {
        try {
            const response = await this.apiService.registerVerify({ email, otp });

            let responseData = response.data;
            if (responseData && responseData.data && !responseData.token) {
                responseData = responseData.data;
            }

            if (responseData && responseData.token) {
                this.tokenService.setToken(responseData.token);
                if (responseData.user) {
                    this.setCurrentUser(responseData.user);
                }
                this.toastService.show('Registration successful', 'success');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Registration verification failed', error);
            throw error;
        }
    }

    logout() {
        this.isLoggingOut.set(true);
        this.currentUser.set(null);
        sessionStorage.removeItem('user');
        this.tokenService.removeToken();
        this.toastService.show('Logged out successfully', 'success');

        // Redirect to home and reload to clear application state
        setTimeout(() => {
            window.location.href = '/';
        }, 100);
    }

    private setCurrentUser(user: User) {
        this.currentUser.set(user);
        sessionStorage.setItem('user', JSON.stringify(user));
    }

    isLoggedIn() {
        return this.currentUser() !== null;
    }
}
