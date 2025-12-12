import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class TokenService {

    constructor() { }

    async getToken(): Promise<string | null> {
        return sessionStorage.getItem('auth_token');
    }

    setToken(token: string) {
        sessionStorage.setItem('auth_token', token);
    }

    removeToken() {
        sessionStorage.removeItem('auth_token');
    }
}
