import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class TokenService {

    constructor() { }

    async getToken(): Promise<string | null> {
        return sessionStorage.getItem('auth_token');
    }

    isTokenExpired(token: string): boolean {
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (!payload.exp) return false;
            // payload.exp is in seconds, Date.now() is in milliseconds
            return Math.floor(Date.now() / 1000) >= payload.exp;
        } catch (e) {
            return true;
        }
    }

    setToken(token: string) {
        sessionStorage.setItem('auth_token', token);
    }

    removeToken() {
        sessionStorage.removeItem('auth_token');
    }
}
