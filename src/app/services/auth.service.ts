import { Injectable, signal } from '@angular/core';
import { ApiService } from './api.service';
import { TokenService } from './token.service';

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

    constructor(
        private apiService: ApiService,
        private tokenService: TokenService
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
                let userData = response.data;
                // Check if wrapped in data property
                if (userData && userData.data) {
                    userData = userData.data;
                }

                this.setCurrentUser(userData);
            } catch (e) {
                console.error('Failed to restore user session', e);
                this.logout();
            }
        }
    }

    async login(email: string, password: string): Promise<boolean> {
        try {
            const response = await this.apiService.login({ email, password });

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
                    // Handle profile response structure too
                    let profileData = profileResponse.data;
                    if (profileData && profileData.data) {
                        profileData = profileData.data;
                    }
                    this.setCurrentUser(profileData);
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login failed', error);
            return false;
        }
    }

    async signup(user: any): Promise<boolean> {
        try {
            await this.apiService.register(user);
            return true;
        } catch (error) {
            console.error('Signup failed', error);
            throw error; // Let component handle error message
        }
    }

    logout() {
        this.currentUser.set(null);
        sessionStorage.removeItem('user');
        this.tokenService.removeToken();
    }

    private setCurrentUser(user: User) {
        this.currentUser.set(user);
        sessionStorage.setItem('user', JSON.stringify(user));
    }

    isLoggedIn() {
        return this.currentUser() !== null;
    }
}
