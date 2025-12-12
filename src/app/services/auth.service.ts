import { Injectable, signal } from '@angular/core';

export interface User {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    role: 'client' | 'owner';
}

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    currentUser = signal<User | null>(null);

    constructor() {
        // Try to restore user from sessionStorage on init
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            try {
                this.currentUser.set(JSON.parse(storedUser));
            } catch (e) {
                console.error('Failed to parse stored user', e);
                sessionStorage.removeItem('user');
            }
        }
    }

    login(email: string, password: string): boolean {
        // Hardcoded credentials
        if (email === 'client@anbu.com' && password === 'client123') {
            const user: User = {
                name: 'Client User',
                email: email,
                role: 'client'
            };
            this.setCurrentUser(user);
            return true;
        }

        if (email === 'owner@anbu.com' && password === 'owner123') {
            const user: User = {
                name: 'Owner User',
                email: email,
                role: 'owner'
            };
            this.setCurrentUser(user);
            return true;
        }

        return false;
    }

    signup(user: User): boolean {
        this.setCurrentUser(user);
        return true;
    }

    logout() {
        this.currentUser.set(null);
        sessionStorage.removeItem('user');
    }

    private setCurrentUser(user: User) {
        this.currentUser.set(user);
        sessionStorage.setItem('user', JSON.stringify(user));
    }

    isLoggedIn() {
        return this.currentUser() !== null;
    }
}
